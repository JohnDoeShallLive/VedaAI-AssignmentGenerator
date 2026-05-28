import admin from 'firebase-admin';

// Check if Firebase is already initialized to avoid multiple initializations in dev mode
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Handle escaped newlines in private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[Firebase Admin] Initialized successfully.');
  } catch (error) {
    console.error('[Firebase Admin] Initialization failed:', error);
  }
}

export const firebaseAdmin = admin;
export const auth = admin.apps.length > 0 ? admin.auth() : null;
