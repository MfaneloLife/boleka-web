import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase-admin';
import { logger } from '@/src/lib/logger';

// Define required environment vars (non-secret safe subset)
const REQUIRED = [
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

// Additional optional vars we still want to display presence for
const OPTIONAL = [
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'GCE_METADATA_HOST',
  'FORCE_LOG_LEVEL',
  'NEXT_PUBLIC_APP_URL',
  'NODE_ENV'
];

// Exclude full secrets from echoing back; only report present/missing
export async function GET(_req: NextRequest) {
  try {
    const requiredReport = REQUIRED.map(key => ({ key, present: !!process.env[key] }));
    const optionalReport = OPTIONAL.map(key => ({ key, present: !!process.env[key] }));
    const missing = requiredReport.filter(r => !r.present).map(r => r.key);

    // Firestore ping: attempt a lightweight read (list 1 doc from a small collection) using a deterministic collection
    let firestore = { ok: false as boolean, latencyMs: null as number | null, error: null as string | null };
    const t0 = Date.now();
    try {
      // Use a metadata collection; if absent, query returns empty quickly.
      await adminDb.collection('systemMeta').limit(1).get();
      firestore.ok = true;
    } catch (err: any) {
      firestore.error = err?.message || 'unknown';
      logger.warn('health.firestoreError', { error: firestore.error });
    } finally {
      firestore.latencyMs = Date.now() - t0;
    }

    return NextResponse.json({
      ok: missing.length === 0 && firestore.ok,
      env: {
        required: requiredReport,
        optional: optionalReport,
        missing,
      },
      firestore,
      counts: { required: REQUIRED.length, missing: missing.length },
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Failed to evaluate env' }, { status: 500 });
  }
}