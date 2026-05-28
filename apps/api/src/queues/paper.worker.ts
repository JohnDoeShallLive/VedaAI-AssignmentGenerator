import { Worker, Job } from 'bullmq';
import { connectionOptions } from '../config/redis';
import { QUEUE_NAME } from './paper.queue';
import { Assignment } from '../models/assignment.model';
import { GeneratedPaper } from '../models/paper.model';
import { generatePaperFromLLM } from '../services/ai.service';
import { broadcastJobEvent } from '../services/websocket.service';
import { redisClient } from '../config/redis';

export function initializePaperWorker() {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job<{ assignmentId: string }>) => {
      const { assignmentId } = job.data;
      console.log(`[worker]: Processing job ${job.id} for assignment ${assignmentId}`);

      // 1. Fetch assignment
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw new Error(`Assignment ${assignmentId} not found`);
      }

      // 2. Set status to processing
      assignment.status = 'processing';
      await assignment.save();

      // 3. Broadcast WebSocket event
      broadcastJobEvent(assignmentId, { event: 'job.processing' });

      // 4. Simulate a slight latency for perfect user feedback experience (2 seconds)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 5. Build paper using LLM or fallback
      let extractedText = '';
      if (assignment.filePath) {
        const path = require('path');
        const physicalPath = path.join(__dirname, '../../uploads', assignment.filePath.replace(/^\/uploads\//, ''));
        console.log(`[worker]: Extracting text from physical file path: ${physicalPath}`);
        
        try {
          const { extractTextFromFile } = require('../services/ai.service');
          const textContent = await extractTextFromFile(physicalPath);
          if (textContent && textContent.trim() !== '') {
            extractedText = `Transcribed reference material content:
--- BEGIN MATERIAL ---
${textContent}
--- END MATERIAL ---

Focus your questions and sections HEAVILY around this reference material.`;
            console.log(`[worker]: Successfully extracted reference text for assignment ${assignmentId}`);
          } else {
            console.warn(`[worker]: Could not extract text from file, falling back to empty context.`);
          }
        } catch (err: any) {
          console.error('[worker]: Reference text extraction threw error:', err.message || err);
        }
      }

      const paperData = await generatePaperFromLLM(assignment, extractedText);

      // 6. Calculate total marks from question config
      const totalMarks = assignment.questionTypes.reduce(
        (sum, q) => sum + q.count * q.marksEach,
        0
      );

      // 7. Save GeneratedPaper Document
      const paper = new GeneratedPaper({
        assignmentId: assignment._id,
        schoolName: 'St. Kabir High School', // Mock school name
        className: 'Class X',                // Mock class
        subject: assignment.subject,
        timeAllowed: paperData.timeAllowed,
        totalMarks: totalMarks,
        sections: paperData.sections,
      });
      await paper.save();

      // 8. Update assignment details
      assignment.status = 'done';
      assignment.resultId = String(paper._id);
      await assignment.save();

      // 9. Invalidate Redis Cache for results
      await redisClient.del(`paper:${assignmentId}`);

      // 10. Broadcast WS job.done event
      broadcastJobEvent(assignmentId, {
        event: 'job.done',
        resultId: paper._id.toString(),
      });

      console.log(`[worker]: Job completed successfully for assignment ${assignmentId}`);
      return { paperId: paper._id.toString() };
    },
    {
      connection: connectionOptions,
      concurrency: 2,
    }
  );

  worker.on('failed', async (job, error) => {
    if (!job) return;
    const { assignmentId } = job.data;
    console.error(`[worker]: Job ${job.id} failed:`, error.message);

    // Check if we have remaining attempts
    const maxAttempts = job.opts.attempts || 3;
    const currentAttempt = job.attemptsMade;

    if (currentAttempt >= maxAttempts) {
      console.log(`[worker]: Job failed finally after ${currentAttempt} attempts. Marking assignment as failed.`);
      try {
        await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
        broadcastJobEvent(assignmentId, { event: 'job.failed' });
      } catch (err) {
        console.error('[worker]: Failed to update assignment status on failure:', err);
      }
    } else {
      console.log(`[worker]: Job will be retried (Attempt ${currentAttempt + 1} of ${maxAttempts})`);
    }
  });

  worker.on('error', (err) => {
    console.error('[worker]: Worker general error:', err);
  });

  console.log(`[worker]: BullMQ Worker registered for queue "${QUEUE_NAME}"`);
  return worker;
}
