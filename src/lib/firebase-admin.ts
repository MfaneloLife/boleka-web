import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const firebaseAdminConfig = {
  projectId: "bolekaweb",
  // For production, you'll need to add your service account key
  // credential: cert({
  //   projectId: process.env.FIREBASE_PROJECT_ID,
  //   clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  //   privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  // }),
};

// Initialize Firebase Admin (only once)
const app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
const adminDb = getFirestore(app);
const adminAuth = getAuth(app);

export { adminDb, adminAuth };
