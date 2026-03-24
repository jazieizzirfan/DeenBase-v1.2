import { fetchWaktuSolatByZone, getNextPrayer } from '../lib/waktusolat';
import HomeClient from '../components/HomeClient';

export const revalidate = 300; // re-fetch every 5 min

export default async function HomePage() {
  let prayerData = null, hijri = null;
  try {
    prayerData = await fetchWaktuSolatByZone('WLY01');
    hijri = prayerData.hijri;
  } catch {}
  const nextPrayer = prayerData ? getNextPrayer(prayerData.timings) : null;
  return <HomeClient prayerData={prayerData} hijri={hijri} nextPrayer={nextPrayer} />;
}
