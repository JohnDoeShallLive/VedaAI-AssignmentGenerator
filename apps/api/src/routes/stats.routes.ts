import { Router, Request, Response, NextFunction } from 'express';
import { Assignment } from '../models/assignment.model';
import { GeneratedPaper } from '../models/paper.model';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Apply requireAuth middleware to protect stats endpoints
router.use(requireAuth);

// 1. GET /api/stats: Aggregate stats for teacher dashboard
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;

    // 1. Total assignments count
    const totalAssignments = await Assignment.countDocuments({ userId });

    // 2. Assignments created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const assignmentsThisMonth = await Assignment.countDocuments({
      userId,
      createdAt: { $gte: startOfMonth },
    });

    // 3. Total questions generated across all generated papers
    const papers = await GeneratedPaper.find({ userId });
    let totalQuestionsGenerated = 0;
    
    for (const paper of papers) {
      if (paper.sections && Array.isArray(paper.sections)) {
        for (const section of paper.sections) {
          if (section.questions && Array.isArray(section.questions)) {
            totalQuestionsGenerated += section.questions.length;
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        totalAssignments,
        assignmentsThisMonth,
        totalQuestionsGenerated,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
