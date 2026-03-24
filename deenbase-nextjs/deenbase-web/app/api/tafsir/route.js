import { NextResponse } from 'next/server';
import { getTafsir } from '../../../lib/api';
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  try { const text = await getTafsir(searchParams.get('surah'), searchParams.get('ayah')); return NextResponse.json({ text }); }
  catch { return NextResponse.json({ text: 'Could not load tafsir.' }); }
}