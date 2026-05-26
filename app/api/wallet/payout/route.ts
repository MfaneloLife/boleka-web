import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    { error: 'Wallet payout functionality is not supported in this deployment' },
    { status: 501 }
  );
}
