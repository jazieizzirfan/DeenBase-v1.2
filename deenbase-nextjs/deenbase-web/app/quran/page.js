// app/quran/page.js
import { getSurahs } from '../../lib/api';
import QuranListClient from '../../components/QuranListClient';

export const metadata = { title: 'Al-Quran – DeenBase' };

export default async function QuranPage() {
  let surahs = [];
  try { surahs = await getSurahs(); } catch { }
  return <QuranListClient surahs={surahs} />;
}
