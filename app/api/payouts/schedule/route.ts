import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = session?.userId?.endsWith('@boleka.admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(
      {
        error: 'Payout scheduling is not supported on this Prisma migration branch',
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Schedule payouts error:', error);
    return NextResponse.json({ error: 'Failed to schedule payouts' }, { status: 500 });
  }
}
