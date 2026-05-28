import { Router, Request, Response, NextFunction } from 'express';
import { GeneratedPaper } from '../models/paper.model';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Apply requireAuth middleware to protect library endpoints
router.use(requireAuth);

// 1. GET /api/library: Search & filter previously generated papers
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, startDate, endDate } = req.query;
    
    // Scoped query filter strictly by userId
    const query: any = { userId: req.userId };

    // Search by title or subject
    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { subject: searchRegex },
        // generated papers snapshot the institution/className, let's allow matching on subject or school snapshots
        { institutionName: searchRegex },
      ];
    }

    // Filter by date ranges
    if (startDate || endDate) {
      query.generatedAt = {};
      if (startDate && typeof startDate === 'string') {
        query.generatedAt.$gte = new Date(startDate).toISOString();
      }
      if (endDate && typeof endDate === 'string') {
        query.generatedAt.$lte = new Date(endDate).toISOString();
      }
    }

    const papers = await GeneratedPaper.find(query).sort({ createdAt: -1 });

    res.json({ success: true, data: papers });
  } catch (error) {
    next(error);
  }
});

export default router;
