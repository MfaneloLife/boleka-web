import { NextRequest, NextResponse } from 'next/server';

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

// Exclude full secrets from echoing back; only report present/missing
export async function GET(_req: NextRequest) {
  try {
    const report = REQUIRED.map(key => ({ key, present: !!process.env[key] }));
    const missing = report.filter(r => !r.present).map(r => r.key);
    return NextResponse.json({
      ok: missing.length === 0,
      missing,
      counts: { required: REQUIRED.length, missing: missing.length },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Failed to evaluate env' }, { status: 500 });
  }
}