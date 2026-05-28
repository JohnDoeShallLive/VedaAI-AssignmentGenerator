import { Router, Request, Response, NextFunction } from 'express';
import { Group } from '../models/group.model';
import { Assignment } from '../models/assignment.model';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Apply requireAuth middleware to protect all group endpoints
router.use(requireAuth);

// 1. GET /api/groups: List all groups scoped to authenticated user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groups = await Group.find({ userId: req.userId }).sort({ createdAt: -1 });
    
    // Map virtual/cached assignment counts dynamically
    const mappedGroups = await Promise.all(
      groups.map(async (grp) => {
        const assignmentCount = await Assignment.countDocuments({ groupId: grp._id });
        return {
          ...grp.toJSON(),
          assignmentCount,
        };
      })
    );

    res.json({ success: true, data: mappedGroups });
  } catch (error) {
    next(error);
  }
});

// 2. POST /api/groups: Create new group
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Group name is required' });
    }

    const group = new Group({
      userId: req.userId,
      name: name.trim(),
      description: description || '',
    });

    await group.save();
    console.log(`[groups]: Created new group "${name}" for user ${req.userId}`);

    res.status(201).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
});

// 3. PUT /api/groups/:id: Update existing group details
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const group = await Group.findOne({ _id: req.params.id, userId: req.userId });

    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found or unauthorized' });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description || '';

    await group.save();
    console.log(`[groups]: Updated group ${req.params.id} details`);

    res.json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
});

// 4. DELETE /api/groups/:id: Delete group (detaches associated assignments gracefully)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const group = await Group.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found or unauthorized' });
    }

    // Detach from all associated assignments (set groupId = undefined)
    await Assignment.updateMany(
      { groupId: req.params.id, userId: req.userId },
      { $unset: { groupId: 1 } }
    );

    console.log(`[groups]: Deleted group ${req.params.id} and detached assignments`);
    res.json({ success: true, message: 'Group deleted successfully and detaches from assignments' });
  } catch (error) {
    next(error);
  }
});

export default router;
