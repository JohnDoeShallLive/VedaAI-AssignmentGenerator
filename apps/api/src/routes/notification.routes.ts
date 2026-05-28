import { Router, Request, Response, NextFunction } from 'express';
import { Notification } from '../models/notification.model';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Apply requireAuth middleware to protect notification endpoints
router.use(requireAuth);

// 1. GET /api/notifications: Fetch notifications scoped to current user, unread first
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ read: 1, createdAt: -1 })
      .limit(50); // limit to last 50 for safety
    
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
});

// 2. PUT /api/notifications/read-all: Mark all unread notifications as read
router.put('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateResult = await Notification.updateMany(
      { userId: req.userId, read: false },
      { $set: { read: true } }
    );

    console.log(`[notifications]: Marked ${updateResult.modifiedCount} notification(s) as read for user ${req.userId}`);
    res.json({ success: true, count: updateResult.modifiedCount });
  } catch (error) {
    next(error);
  }
});

export default router;
