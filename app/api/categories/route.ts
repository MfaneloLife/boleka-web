import { NextRequest, NextResponse } from 'next/server';

// In a real application, this would fetch from the database
// For now, we'll use static data
const categories = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'home-garden', name: 'Home & Garden' },
  { id: 'vehicles', name: 'Vehicles' },
  { id: 'clothing', name: 'Clothing' },
  { id: 'sports-outdoors', name: 'Sports & Outdoors' },
  { id: 'toys-games', name: 'Toys & Games' },
  { id: 'tools-equipment', name: 'Tools & Equipment' },
  { id: 'other', name: 'Other' }
];

export async function GET(req: NextRequest) {
  return NextResponse.json(categories);
}
