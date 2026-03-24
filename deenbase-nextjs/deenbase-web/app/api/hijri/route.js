import { NextResponse } from 'next/server';
import { getHijriDate } from '../../../lib/api';
export async function GET() {
  try { const h = await getHijriDate(); return NextResponse.json({ hijri: h }); }
  catch { return NextResponse.json({ hijri: null }); }
}