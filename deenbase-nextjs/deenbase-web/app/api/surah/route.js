// app/api/surah/route.js
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getSurah } from '../../../lib/api';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const num = searchParams.get('num');
  const lang = searchParams.get('lang') || 'en';
  try {
    const data = await getSurah(+num, lang);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
