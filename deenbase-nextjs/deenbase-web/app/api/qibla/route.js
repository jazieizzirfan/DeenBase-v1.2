export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getQibla } from '../../../lib/api';
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  try { const dir = await getQibla(+searchParams.get('lat'), +searchParams.get('lng')); return NextResponse.json({ direction: dir }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}