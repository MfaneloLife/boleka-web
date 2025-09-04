import { NextRequest, NextResponse } from 'next/server';

// In a real application, this would fetch from the database
// For now, we'll use static data
const locations = [
  { id: 'johannesburg', name: 'Johannesburg' },
  { id: 'cape-town', name: 'Cape Town' },
  { id: 'durban', name: 'Durban' },
  { id: 'pretoria', name: 'Pretoria' },
  { id: 'port-elizabeth', name: 'Port Elizabeth' },
  { id: 'bloemfontein', name: 'Bloemfontein' },
  { id: 'east-london', name: 'East London' },
  { id: 'nelspruit', name: 'Nelspruit' },
  { id: 'kimberley', name: 'Kimberley' },
  { id: 'polokwane', name: 'Polokwane' }
];

export async function GET(req: NextRequest) {
  return NextResponse.json(locations);
}
