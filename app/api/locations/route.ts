import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get unique locations from items (using province/city from item data)
    // Fallback to static South African provinces
    const fallbackLocations = [
      { id: 'gauteng', name: 'Gauteng' },
      { id: 'western-cape', name: 'Western Cape' },
      { id: 'kwazulu-natal', name: 'KwaZulu-Natal' },
      { id: 'eastern-cape', name: 'Eastern Cape' },
      { id: 'free-state', name: 'Free State' },
      { id: 'limpopo', name: 'Limpopo' },
      { id: 'mpumalanga', name: 'Mpumalanga' },
      { id: 'north-west', name: 'North West' },
      { id: 'northern-cape', name: 'Northern Cape' }
    ];
    return NextResponse.json(fallbackLocations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    
    const fallbackLocations = [
      { id: 'gauteng', name: 'Gauteng' },
      { id: 'western-cape', name: 'Western Cape' },
      { id: 'kwazulu-natal', name: 'KwaZulu-Natal' },
      { id: 'eastern-cape', name: 'Eastern Cape' },
      { id: 'free-state', name: 'Free State' },
      { id: 'limpopo', name: 'Limpopo' },
      { id: 'mpumalanga', name: 'Mpumalanga' },
      { id: 'north-west', name: 'North West' },
      { id: 'northern-cape', name: 'Northern Cape' }
    ];
    return NextResponse.json(fallbackLocations);
  }
}
