const QURAN_BASE = 'https://api.alquran.cloud/v1';
const PRAYER_BASE = 'https://api.aladhan.com/v1';

// ── Quran ─────────────────────────────────────────────────────────
export async function getSurahs() {
  const res = await fetch(`${QURAN_BASE}/surah`, { next: { revalidate: 86400 } });
  const data = await res.json();
  if (data.status !== 'OK') throw new Error('Failed to load surahs');
  return data.data;
}

export async function getSurah(num, lang = 'en') {
  const ed = lang === 'en' ? 'en.sahih' : 'ms.basmeih';
  const [arRes, trRes] = await Promise.all([
    fetch(`${QURAN_BASE}/surah/${num}/quran-uthmani`, { next: { revalidate: 86400 } }),
    fetch(`${QURAN_BASE}/surah/${num}/${ed}`,          { next: { revalidate: 86400 } }),
  ]);
  const [ar, tr] = await Promise.all([arRes.json(), trRes.json()]);
  if (ar.status !== 'OK') throw new Error('Surah not found');
  return { arabic: ar.data, translation: tr.data };
}

export async function getTafsir(surah, ayah) {
  const res = await fetch(`${QURAN_BASE}/ayah/${surah}:${ayah}/en.italiansafar`, { next: { revalidate: 86400 } });
  const data = await res.json();
  return data.data?.text || 'No tafsir available.';
}

export async function searchQuran(query, lang = 'en') {
  const ed = lang === 'en' ? 'en.sahih' : 'ms.basmeih';
  const res = await fetch(`${QURAN_BASE}/search/${encodeURIComponent(query)}/all/${ed}`, { cache: 'no-store' });
  const data = await res.json();
  return data.data?.matches || [];
}

// ── Prayer ────────────────────────────────────────────────────────
export async function getPrayerByCity(city, country, method = 11) {
  const url = `${PRAYER_BASE}/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  if (data.code !== 200) throw new Error(data.data || 'City not found');
  return data.data;
}

export async function getPrayerByCoords(lat, lng, method = 11) {
  const url = `${PRAYER_BASE}/timings?latitude=${lat}&longitude=${lng}&method=${method}`;
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  if (data.code !== 200) throw new Error('Location lookup failed');
  return data.data;
}

export async function getQibla(lat, lng) {
  const res = await fetch(`${PRAYER_BASE}/qibla/${lat}/${lng}`, { next: { revalidate: 3600 } });
  const data = await res.json();
  if (data.code === 200) return data.data.direction;
  // Fallback: Haversine calculation
  return calcQiblaLocal(lat, lng);
}

export async function getHijriDate() {
  const d = new Date();
  const res = await fetch(`${PRAYER_BASE}/gToH/${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`, { next: { revalidate: 3600 } });
  const data = await res.json();
  return data.data?.hijri || null;
}

// ── Helpers ───────────────────────────────────────────────────────
export function calcQiblaLocal(lat, lng) {
  const ML = 21.4225, MLo = 39.8262;
  const dLng = (MLo - lng) * Math.PI / 180;
  const l1 = lat * Math.PI / 180, l2 = ML * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(l2);
  const x = Math.cos(l1) * Math.sin(l2) - Math.sin(l1) * Math.cos(l2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export function getNextPrayer(timings) {
  const SALAH = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
  if (!timings) return null;
  const now = new Date(), cur = now.getHours() * 60 + now.getMinutes();
  for (const name of SALAH) {
    const t = timings[name]; if (!t) continue;
    const [h, m] = t.split(':').map(Number);
    if (h * 60 + m > cur) return { name, time: t, mins: h * 60 + m };
  }
  const t = timings['Fajr'] || '05:00';
  const [h, m] = t.split(':').map(Number);
  return { name: 'Fajr', time: t, mins: h * 60 + m };
}

export function audioUrl(num) {
  return `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${num}.mp3`;
}
