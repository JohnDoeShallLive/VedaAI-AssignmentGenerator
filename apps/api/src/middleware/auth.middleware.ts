import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { User } from '../models/user.model';

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // 1. Check Authorization header (Bearer <Token>)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Check cookies if not in header
    if (!token && req.cookies && req.cookies.__session) {
      token = req.cookies.__session;
    }

    if (!token) {
      console.warn('[auth-middleware]: Missing authorization token in request headers/cookies');
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing session token' });
    }

    // Decode and verify session token or ID token using Firebase Admin
    let decodedToken;
    try {
      // First try to verify as a session cookie
      decodedToken = await auth.verifySessionCookie(token, true);
    } catch (sessionError) {
      try {
        // Fallback to verifying as an ID token
        decodedToken = await auth.verifyIdToken(token);
      } catch (idTokenError) {
        console.warn('[auth-middleware]: Firebase token verification failed');
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
      }
    }

    if (!decodedToken || !decodedToken.uid) {
      console.warn('[auth-middleware]: Token payload missing uid');
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token payload' });
    }

    const firebaseUid = decodedToken.uid;

    // Find the MongoDB user corresponding to this firebaseUid
    const user = await User.findOne({ firebaseUid }).select('_id').lean();
    
    if (!user) {
      console.warn(`[auth-middleware]: User not found in MongoDB for firebaseUid: ${firebaseUid}`);
      return res.status(401).json({ success: false, error: 'Unauthorized: User record not found' });
    }

    req.userId = user._id.toString();
    next();
  } catch (error: any) {
    console.error('[auth-middleware]: Authentication middleware encountered an error:', error.message || error);
    return res.status(401).json({ success: false, error: 'Unauthorized: Authentication failed' });
  }
}
