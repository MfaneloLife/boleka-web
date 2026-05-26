import { NextRequest, NextResponse } from 'next/server';
import { COUNTRIES, COUNTRY_LIST } from '@/src/lib/countries';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const countryCode = url.searchParams.get('country');
    const type = url.searchParams.get('type') || 'countries'; // 'countries' or 'regions'

    if (type === 'regions') {
      if (!countryCode || !COUNTRIES[countryCode]) {
        return NextResponse.json(
          { error: 'Valid country code is required' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        country: COUNTRIES[countryCode],
        regions: COUNTRIES[countryCode].regions,
      });
    }

    // Return all countries
    return NextResponse.json({
      countries: COUNTRY_LIST,
      defaultCountry: 'ZA',
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { countries: COUNTRY_LIST, defaultCountry: 'ZA' },
      { status: 200 }
    );
  }
}
