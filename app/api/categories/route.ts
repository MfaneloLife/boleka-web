import { NextResponse } from 'next/server';
import { UNIFIED_CATEGORIES } from '@/src/lib/categories';

export async function GET() {
  return NextResponse.json(UNIFIED_CATEGORIES);
}