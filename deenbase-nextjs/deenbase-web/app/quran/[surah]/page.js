import { getSurah } from '../../../lib/api';
import ReaderClient from '../../../components/ReaderClient';

export async function generateMetadata({ params }) {
  try {
    const { arabic } = await getSurah(+params.surah, 'en');
    return { title: `${arabic.englishName} – DeenBase` };
  } catch {
    return { title: `Surah ${params.surah} – DeenBase` };
  }
}

export default async function SurahPage({ params, searchParams }) {
  const num = +params.surah;
  const lang = searchParams?.lang || 'en';
  let data = null;
  try { data = await getSurah(num, lang); } catch {}
  return <ReaderClient surahNum={num} data={data} initialLang={lang} />;
}
