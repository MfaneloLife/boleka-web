import { NextRequest, NextResponse } from 'next/server';

const categories = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'home', name: 'Home & Garden' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'sports', name: 'Sports & Leisure' },
  { id: 'vehicles', name: 'Vehicles' },
  { id: 'toys-games', name: 'Toys & Games' },
  { id: 'tools-equipment', name: 'Tools & Equipment' },
  { id: 'books', name: 'Books & Media' },
  { id: 'music', name: 'Music & Instruments' },
  { id: 'photography', name: 'Photography & Video' },
  { id: 'camping', name: 'Camping & Outdoor' },
  { id: 'other', name: 'Other' },
];

export async function GET() {
  return NextResponse.json(categories);
}