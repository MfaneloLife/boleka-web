import { NextRequest, NextResponse } from 'next/server';
import { FirebaseDbService, BusinessProfile } from '@/src/lib/firebase-db';

export async function GET(req: NextRequest) {
  try {
    // Get unique locations from business profiles
    const businessProfilesResult = await FirebaseDbService.getAllBusinessProfiles();
    
    if (!businessProfilesResult.success || !businessProfilesResult.profiles) {
      // Fallback to static locations if Firebase fetch fails
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

    // Extract unique provinces and cities from business profiles
    const locationSet = new Set<string>();
    const locations: { id: string; name: string }[] = [];

    businessProfilesResult.profiles.forEach((profile: BusinessProfile) => {
      if (profile.province) {
        const provinceKey = profile.province.toLowerCase().replace(/\s+/g, '-');
        if (!locationSet.has(provinceKey)) {
          locationSet.add(provinceKey);
          locations.push({
            id: provinceKey,
            name: profile.province
          });
        }
      }
      
      if (profile.city) {
        const cityKey = profile.city.toLowerCase().replace(/\s+/g, '-');
        if (!locationSet.has(cityKey)) {
          locationSet.add(cityKey);
          locations.push({
            id: cityKey,
            name: profile.city
          });
        }
      }
    });

    // Sort locations alphabetically
    locations.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    
    // Return static fallback locations on error
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
