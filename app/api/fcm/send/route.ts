import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  return NextResponse.json(
    {
      success: false,
      error: 'FCM push notifications are not supported on this branch',
    },
    { status: 501 }
  );
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const targetUserId = searchParams.get('userId') || userId;
  const limit = parseInt(searchParams.get('limit') || '20');

  if (targetUserId !== userId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Notification retrieval is not supported on this branch',
    },
    { status: 501 }
  );
}
