import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    { error: 'Wallet refund functionality is not supported in this deployment' },
    { status: 501 }
  );
}
