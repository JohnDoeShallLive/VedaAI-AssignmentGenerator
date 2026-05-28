import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { User } from '../models/user.model';

const router = Router();

// POST /api/auth/sync
// Validates Firebase ID token, upserts the user in MongoDB, and sets a session cookie
router.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, error: 'ID token is required' });
    }

    // Verify ID token
    if (!auth) {
      return res.status(500).json({ success: false, error: 'Firebase auth service is unavailable' });
    }
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email, name, picture, sign_in_provider } = decodedToken;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email not found in token' });
    }

    // Determine provider
    const provider = sign_in_provider === 'password' ? 'credentials' : 'google';

    // Upsert User in MongoDB
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      // Sync firebaseUid if it's the first time
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
      }
      if (!user.avatarUrl && picture) {
        user.avatarUrl = picture;
      }
      await user.save();
    } else {
      // Create new user
      user = new User({
        firebaseUid: uid,
        email: email.toLowerCase(),
        name: name || 'User', // Fallback if name is missing
        avatarUrl: picture,
        provider,
        onboardingComplete: false,
        role: 'Teacher',
      });
      await user.save();
    }

    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    res.cookie('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        onboardingComplete: user.onboardingComplete,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error('[auth-sync]: Error during sync:', error);
    res.status(401).json({ success: false, error: 'Invalid or expired ID token' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('__session');
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
