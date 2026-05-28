import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { User } from '../models/user.model';
import { requireAuth } from '../middleware/auth.middleware';
import { uploadToCloudinary } from '../services/cloudinary.service';

const router = Router();

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG and JPEG images are allowed.'));
    }
  },
});

// Apply requireAuth middleware to protect all user settings endpoints
router.use(requireAuth);

// 1. POST /api/users/upload: Upload profile avatars or institution logos
router.post('/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    try {
      // Try Cloudinary upload
      const cloudinaryUrl = await uploadToCloudinary(
        req.file.buffer,
        'users',
        req.file.originalname
      );

      if (cloudinaryUrl) {
        return res.json({ success: true, url: cloudinaryUrl });
      }
    } catch (cloudinaryErr) {
      console.warn('[users-upload]: Cloudinary upload failed, using local disk fallback:', cloudinaryErr);
    }

    // Fallback to local uploads
    const UPLOADS_DIR = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `logo-${uniqueSuffix}${path.extname(req.file.originalname)}`;
    const physicalPath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(physicalPath, req.file.buffer);
    const localUrl = `/uploads/${filename}`;
    
    console.log(`[users-upload]: Saved upload file to local disk: ${localUrl}`);
    res.json({ success: true, url: localUrl });
  } catch (error) {
    next(error);
  }
});

// 2. GET /api/users/me: Get current authenticated user details
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// 3. PUT /api/users/me: Update user profile
router.put('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, avatarUrl, password } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    if (name) user.name = name.trim();
    if (avatarUrl) user.avatarUrl = avatarUrl;
    
    // Password updates should be handled via Firebase Client SDK directly.
    // We ignore password payload here since passwordHash is removed.

    await user.save();
    console.log(`[users]: Updated profile settings for user: ${user.email}`);

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// 4. PUT /api/users/me/institution: Update institution details (onboarding & settings)
router.put('/me/institution', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type, city, board, logoUrl } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'Institution Name and Type are required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    // Set or update the institution subdocument
    user.institution = {
      name,
      type,
      city: city || '',
      board: board || '',
      logoUrl: logoUrl || user.institution?.logoUrl || '',
    };
    user.onboardingComplete = true; // Complete onboarding flags upon submission!

    await user.save();
    console.log(`[users]: Updated institution details for user: ${user.email}`);

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
