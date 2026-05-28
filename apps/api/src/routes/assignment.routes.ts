import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Assignment } from '../models/assignment.model';
import { GeneratedPaper } from '../models/paper.model';
import { paperQueue } from '../queues/paper.queue';
import { redisClient } from '../config/redis';
import { broadcastJobEvent } from '../services/websocket.service';
import { generatePDF } from '../services/pdf.service';

const router = Router();


// Configure multer storage
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, and JPEG are allowed.'));
    }
  },
});

// Helper for caching
const CACHE_TTL = 3600; // 1 hour

// 1. GET /assignments: List all assignments
router.get('/assignments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
});

// 2. GET /assignments/:id: Single assignment details
router.get('/assignments/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }
    res.json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
});

// 3. POST /assignments: Create assignment and enqueue job
router.post('/assignments', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, subject, dueDate, questionTypes, additionalInfo } = req.body;

    if (!title || !subject || !dueDate || !questionTypes) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Parse questionTypes if it was sent as a string (multipart/form-data)
    let parsedQuestionTypes = questionTypes;
    if (typeof questionTypes === 'string') {
      try {
        parsedQuestionTypes = JSON.parse(questionTypes);
      } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid JSON format for questionTypes' });
      }
    }

    // Validation rules
    if (!Array.isArray(parsedQuestionTypes) || parsedQuestionTypes.length === 0) {
      return res.status(400).json({ success: false, error: 'Question types must be a non-empty array' });
    }

    // Strict payload checks for OOM/DoS protection and metadata bounds
    let totalQuestions = 0;
    let totalMarks = 0;
    const allowedTypes = ['mcq', 'short', 'diagram', 'numerical', 'long'];

    for (const qType of parsedQuestionTypes) {
      if (!qType.type || !allowedTypes.includes(qType.type)) {
        return res.status(400).json({ success: false, error: `Invalid question type: ${qType.type}` });
      }
      if (typeof qType.count !== 'number' || qType.count < 1 || qType.count > 50) {
        return res.status(400).json({ success: false, error: `Question count must be between 1 and 50 for ${qType.type}` });
      }
      if (typeof qType.marksEach !== 'number' || qType.marksEach < 1 || qType.marksEach > 20) {
        return res.status(400).json({ success: false, error: `Marks per question must be between 1 and 20 for ${qType.type}` });
      }
      totalQuestions += qType.count;
      totalMarks += qType.count * qType.marksEach;
    }

    if (totalQuestions > 100) {
      return res.status(400).json({ success: false, error: 'Total questions cannot exceed 100' });
    }
    if (totalMarks > 200) {
      return res.status(400).json({ success: false, error: 'Total marks cannot exceed 200' });
    }

    // Create Assignment
    const assignment = new Assignment({
      title,
      subject,
      dueDate,
      questionTypes: parsedQuestionTypes,
      additionalInfo: additionalInfo || '',
      filePath: req.file ? `/uploads/${req.file.filename}` : undefined,
      status: 'queued',
    });

    await assignment.save();

    // Enqueue job to BullMQ
    const job = await paperQueue.add('generate-paper', {
      assignmentId: assignment._id.toString(),
    });

    res.status(201).json({
      success: true,
      data: {
        _id: assignment._id.toString(),
        status: assignment.status,
        jobId: job.id,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Helper cleanup for deleted assignment
async function cleanupAssignmentResources(assignment: any, assignmentId: string) {
  // 1. Delete file on disk
  if (assignment.filePath) {
    try {
      const filename = assignment.filePath.replace(/^\/uploads\//, '');
      const physicalPath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(physicalPath)) {
        fs.unlinkSync(physicalPath);
        console.log(`[cleanup]: Deleted physical file: ${physicalPath}`);
      }
    } catch (fileErr: any) {
      console.error(`[cleanup-error]: Failed to unlink physical file: ${fileErr.message}`);
    }
  }

  // 2. Delete all generated papers (prevent orphans)
  try {
    const delResult = await GeneratedPaper.deleteMany({ assignmentId });
    console.log(`[cleanup]: Deleted ${delResult.deletedCount} paper(s) for assignment ${assignmentId}`);
  } catch (dbErr: any) {
    console.error(`[cleanup-error]: Failed to delete paper documents: ${dbErr.message}`);
  }

  // 3. Remove active or waiting queue jobs from BullMQ
  try {
    const jobs = await paperQueue.getJobs(['waiting', 'active', 'delayed', 'paused']);
    for (const job of jobs) {
      if (job.data?.assignmentId === assignmentId) {
        await job.remove();
        console.log(`[cleanup]: Removed job ${job.id} from queue for assignment ${assignmentId}`);
      }
    }
  } catch (queueErr: any) {
    console.error(`[cleanup-error]: Failed to scan/remove queue jobs: ${queueErr.message}`);
  }

  // 4. Invalidate Redis Cache
  try {
    await redisClient.del(`paper:${assignmentId}`);
    console.log(`[cleanup]: Invalidated cache key paper:${assignmentId}`);
  } catch (cacheErr: any) {
    console.error(`[cleanup-error]: Failed to invalidate Redis cache: ${cacheErr.message}`);
  }
}

// 4. DELETE /assignments/:id: Delete assignment & associated items
router.get('/assignments/:id/delete-dev', async (req: Request, res: Response, next: NextFunction) => {
  // Add a GET request endpoint to delete for easy manual cleanup
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }
    await cleanupAssignmentResources(assignment, req.params.id);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/assignments/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    await cleanupAssignmentResources(assignment, req.params.id);
    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// 5. GET /assignments/:id/result: Fetch generated paper result (caches to Redis)
router.get('/assignments/:id/result', async (req: Request, res: Response, next: NextFunction) => {
  const assignmentId = req.params.id;
  try {
    // 1. Check cache first
    const cacheKey = `paper:${assignmentId}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      console.log(`[cache]: Serving paper result from Redis cache for assignment ${assignmentId}`);
      return res.json({ success: true, data: JSON.parse(cachedData) });
    }

    // 2. Fetch from DB
    console.log(`[db]: Cache miss. Querying MongoDB for generated paper of assignment ${assignmentId}`);
    const paper = await GeneratedPaper.findOne({ assignmentId });

    if (!paper) {
      return res.status(404).json({
        success: false,
        error: 'Generated paper not found for this assignment',
      });
    }

    // 3. Cache in Redis
    await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(paper));

    res.json({ success: true, data: paper });
  } catch (error) {
    next(error);
  }
});

// 6. POST /assignments/:id/regenerate: Re-trigger job
router.post('/assignments/:id/regenerate', async (req: Request, res: Response, next: NextFunction) => {
  const assignmentId = req.params.id;
  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    // Delete existing paper
    await GeneratedPaper.deleteOne({ assignmentId });

    // Invalidate Cache
    await redisClient.del(`paper:${assignmentId}`);

    // Update assignment status to queued
    assignment.status = 'queued';
    assignment.resultId = undefined;
    await assignment.save();

    // Trigger websocket queued broadcast
    broadcastJobEvent(assignmentId, { event: 'job.queued' });

    // Add to queue
    const job = await paperQueue.add('generate-paper', {
      assignmentId,
    });

    res.json({
      success: true,
      message: 'Regeneration job queued',
      data: {
        _id: assignmentId,
        status: 'queued',
        jobId: job.id,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 7. GET /assignments/:id/pdf: Download A4 PDF generated by Puppeteer
router.get('/assignments/:id/pdf', async (req: Request, res: Response, next: NextFunction) => {
  const assignmentId = req.params.id;
  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }
    const pdfBuffer = await generatePDF(assignmentId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=assignment-${assignmentId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

export default router;
