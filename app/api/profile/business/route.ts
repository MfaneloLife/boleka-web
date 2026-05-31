import { NextRequest, NextResponse } from 'next/server';

// This endpoint has been removed. Business profile fields are now part of /api/profile.
export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Endpoint removed - use /api/profile instead' }, { status: 410 });
}