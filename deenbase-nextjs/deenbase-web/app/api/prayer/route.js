export const runtime = 'edge';
import { NextResponse } from 'next/server';
import {
  fetchWaktuSolatByZone,
  fetchPrayerSmart,
  fetchPrayerByCoordsSmart,
  resolveZone,
} from '../../../lib/waktusolat';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const zone = searchParams.get('zone');
  const city = searchParams.get('city');
  const country = searchParams.get('country');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  try {
    let data;

    if (lat && lng) {
      // GPS coordinates — auto-detect MY zone or fallback Aladhan
      data = await fetchPrayerByCoordsSmart(parseFloat(lat), parseFloat(lng));
    } else if (zone) {
      // Direct zone code e.g. WLY01
      data = await fetchWaktuSolatByZone(zone);
    } else if (city) {
      // City name — smart: use JAKIM if MY, Aladhan otherwise
      data = await fetchPrayerSmart(city, country || 'MY');
    } else {
      return NextResponse.json({ error: 'Provide zone, city, or lat/lng' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to fetch prayer times' }, { status: 400 });
  }
}
