import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (server-side only)
if (!admin.apps.length) {
  // Extract project ID from the public Firebase config
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.split('.')[0];

  try {
    // Try to use service account credentials (best for production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId,
      });
    } else {
      // For development: use application default credentials
      // This works if you have gcloud CLI configured or Firebase emulator running
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId,
      });
    }
  } catch (error) {
    console.warn('Failed to initialize with credentials, trying project ID only:', error);

    // Fallback: initialize with project ID only (limited functionality)
    if (projectId) {
      admin.initializeApp({
        projectId: projectId,
      });
    } else {
      console.error('Firebase Admin SDK could not be initialized. Please set up authentication.');
      throw new Error('Firebase Admin SDK initialization failed');
    }
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

export default admin;
