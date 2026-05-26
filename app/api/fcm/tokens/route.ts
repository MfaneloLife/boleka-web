import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
function unauthorizedResponse() {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return unauthorizedResponse();
  }

  return NextResponse.json(
    { error: 'FCM token operations are not supported in this deployment' },
    { status: 501 }
  );
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return unauthorizedResponse();
  }

  return NextResponse.json(
    { error: 'FCM token operations are not supported in this deployment' },
    { status: 501 }
  );
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return unauthorizedResponse();
  }

  return NextResponse.json(
    { error: 'FCM token operations are not supported in this deployment' },
    { status: 501 }
  );
}
