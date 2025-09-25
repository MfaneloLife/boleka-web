import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { FirebaseDbService } from '@/src/lib/firebase-db';

// Schedules payouts for all completed payments that are not yet marked as merchantPaid
// Intended to be called by a cron or admin – simple scan-and-settle placeholder
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.email?.endsWith('@boleka.admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // @ts-ignore
    const adminDb = (await import('@/src/lib/firebase-admin')).adminDb;
    const snap = await adminDb.collection('payments').where('status', '==', 'COMPLETED').where('merchantPaid', '==', false).get();
    const batch = adminDb.batch();
    const now = new Date();
    snap.forEach((doc: any) => {
      batch.update(doc.ref, { merchantPaid: true, merchantPayoutDate: now, status: 'PAID' });
    });
    await batch.commit();
    return NextResponse.json({ success: true, settled: snap.size });
  } catch (error) {
    console.error('Schedule payouts error:', error);
    return NextResponse.json({ error: 'Failed to schedule payouts' }, { status: 500 });
  }
}
