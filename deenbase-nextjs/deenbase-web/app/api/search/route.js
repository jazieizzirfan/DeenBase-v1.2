import { NextResponse } from 'next/server';
import { searchQuran } from '../../../lib/api';
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  try { const results = await searchQuran(searchParams.get('q'), searchParams.get('lang') || 'en'); return NextResponse.json({ results }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}