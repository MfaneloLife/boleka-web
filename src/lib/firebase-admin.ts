import { initializeApp, getApps, cert, AppOptions } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { logger } from './logger';

const requiredAdminEnv = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

const missing = requiredAdminEnv.filter(k => !process.env[k]);
if (missing.length) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required Firebase Admin env vars: ${missing.join(', ')}`);
  } else {
    // In development we warn and allow ADC fallback (may trigger metadata probes unless GCE_METADATA_HOST=disabled)
    logger.warn('firebaseAdmin.missingEnv', { missing });
  }
}

let credentialPart: Partial<AppOptions> = {};
if (missing.length === 0) {
  try {
    credentialPart = {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      })
    };
  } catch (e) {
    logger.error('firebaseAdmin.certInitError', { error: (e as any)?.message });
    if (process.env.NODE_ENV === 'production') throw e;
  }
}

const firebaseAdminConfig: AppOptions = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'dev-placeholder-project',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || (process.env.FIREBASE_PROJECT_ID ? `${process.env.FIREBASE_PROJECT_ID}.appspot.com` : undefined),
  ...credentialPart
};

// Initialize Firebase Admin (only once)
const app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
logger.debug('firebaseAdmin.init', { usingCredential: !!credentialPart.credential, projectId: firebaseAdminConfig.projectId });
const adminDb = getFirestore(app);
const adminAuth = getAuth(app);
const adminStorage = getStorage(app);

export { adminDb, adminAuth, adminStorage };
