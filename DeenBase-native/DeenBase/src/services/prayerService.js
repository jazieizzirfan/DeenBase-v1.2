/**
 * DeenBase — Prayer Service (React Native)
 * Primary: api.waktusolat.app (JAKIM data, most accurate for Malaysia)
 * Fallback: api.aladhan.com (for non-MY zones or when primary fails)
 */

import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

const WAKTU_BASE = 'https://api.waktusolat.app';
const ALADHAN_BASE = 'https://api.aladhan.com/v1';
const SALAH = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];

// ─── Notification setup ────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status: e } = await Notifications.getPermissionsAsync();
  if (e === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation() {
  const granted = await requestLocationPermission();
  if (!granted) throw new Error('Location permission denied');
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeout: 8000 });
  return { lat: loc.coords.latitude, lng: loc.coords.longitude };
}

// ─── Epoch → HH:MM ────────────────────────────────────────────────
function epochToTime(epoch) {
  if (!epoch) return null;
  const d = new Date(epoch * 1000);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ─── Malaysian zone codes ──────────────────────────────────────────
const MY_ZONES = {
  'Kuala Lumpur':'WLY01','KL':'WLY01','Putrajaya':'WLY02','Labuan':'WLY03',
  'Shah Alam':'SGR01','Selangor':'SGR01','Petaling Jaya':'SGR01','Klang':'SGR02',
  'Johor Bahru':'JHR01','Johor':'JHR01','Muar':'JHR05','Batu Pahat':'JHR04',
  'Alor Setar':'KDH01','Kedah':'KDH01','Langkawi':'KDH07',
  'Kota Bharu':'KTN01','Kelantan':'KTN01',
  'Melaka':'MLK01','Malacca':'MLK01',
  'Seremban':'NSN01','Negeri Sembilan':'NSN01',
  'Kuantan':'PHG01','Pahang':'PHG01','Cameron Highlands':'PHG05',
  'Penang':'PNG01','Pulau Pinang':'PNG01','George Town':'PNG01',
  'Ipoh':'PRK01','Perak':'PRK01','Taiping':'PRK02',
  'Kangar':'PLS01','Perlis':'PLS01',
  'Kota Kinabalu':'SBH01','Sabah':'SBH01','Sandakan':'SBH04','Tawau':'SBH07',
  'Kuching':'SWK01','Sarawak':'SWK01','Miri':'SWK07','Sibu':'SWK04',
  'Kuala Terengganu':'TRG01','Terengganu':'TRG01',
};

export function resolveZone(city) {
  if (!city) return null;
  const q = city.trim();
  const exact = MY_ZONES[q];
  if (exact) return exact;
  const lower = q.toLowerCase();
  for (const [k,v] of Object.entries(MY_ZONES)) {
    if (k.toLowerCase() === lower) return v;
  }
  for (const [k,v] of Object.entries(MY_ZONES)) {
    if (k.toLowerCase().includes(lower)||lower.includes(k.toLowerCase())) return v;
  }
  if (/^[A-Z]{2,3}\d{2}$/i.test(q)) return q.toUpperCase();
  return null;
}

// ─── Fetch Waktu Solat Malaysia ────────────────────────────────────
export async function fetchWaktuSolatByZone(zone) {
  const res = await fetchWithTimeout(`${WAKTU_BASE}/v2/solat/${zone.toUpperCase()}`, 8000);
  if (!res.ok) throw new Error(`Zone ${zone} not found`);
  const data = await res.json();
  if (!data.prayers?.length) throw new Error('No prayer data');

  const today = new Date().getDate();
  const row = data.prayers.find(p => p.day === today) || data.prayers[0];

  const timings = {
    Imsak:   epochToTime(row.fajr - 600) || '—',
    Fajr:    epochToTime(row.fajr),
    Sunrise: epochToTime(row.syuruk),
    Dhuhr:   epochToTime(row.dhuhr),
    Asr:     epochToTime(row.asr),
    Maghrib: epochToTime(row.maghrib),
    Isha:    epochToTime(row.isha),
    Midnight:'—',
  };

  let hijri = null;
  if (row.hijri) {
    const [y,m,d] = row.hijri.split('-');
    const MEN=['Muharram','Safar',"Rabi' al-Awwal","Rabi' al-Akhir","Jumada al-Ula","Jumada al-Akhirah",'Rajab',"Sha'ban",'Ramadan','Shawwal',"Dhu al-Qi'dah","Dhu al-Hijjah"];
    const MAR=['مُحَرَّم','صَفَر','رَبِيعُ ٱلْأَوَّل','رَبِيعُ ٱلثَّانِي','جُمَادَىٰ ٱلْأُولَىٰ','جُمَادَىٰ ٱلثَّانِيَة','رَجَب','شَعْبَان','رَمَضَان','شَوَّال','ذُو ٱلْقَعْدَة','ذُو ٱلْحِجَّة'];
    const mi = parseInt(m,10)-1;
    hijri={day:d,month:{en:MEN[mi]||m,ar:MAR[mi]||m},year:y};
  }

  return {
    timings, hijri,
    zone: data.zone,
    source: 'waktusolat.app (JAKIM)',
    date: { readable: new Date().toLocaleDateString('en-MY',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) },
    meta: { method: { name: `JAKIM · ${zone.toUpperCase()}` }, zone: data.zone },
  };
}

// ─── Smart fetch: MY uses JAKIM, others use Aladhan ───────────────
export async function fetchPrayerSmart(city, country='MY') {
  const isMY = country.toUpperCase()==='MY';
  if (isMY) {
    const zone = resolveZone(city);
    if (zone) { try { return await fetchWaktuSolatByZone(zone); } catch {} }
    try { return await fetchAladhanByCity(city,'MY',11); } catch {}
  }
  return fetchAladhanByCity(city, country, 3);
}

export async function fetchPrayerByCoords(lat, lng) {
  // Try reverse geocode to find MY zone
  try {
    const r = await fetchWithTimeout(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, 5000);
    const geo = await r.json();
    const city = geo.address?.city||geo.address?.town||geo.address?.village||'';
    if (geo.address?.country_code?.toUpperCase()==='MY') {
      const zone = resolveZone(city);
      if (zone) { try { return await fetchWaktuSolatByZone(zone); } catch {} }
    }
  } catch {}
  return fetchAladhanByCoords(lat, lng, 11);
}

// ─── Aladhan fallbacks ────────────────────────────────────────────
async function fetchAladhanByCity(city, country, method=3) {
  const res = await fetchWithTimeout(`${ALADHAN_BASE}/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`, 8000);
  const d = await res.json();
  if (d.code!==200) throw new Error(d.data||'City not found');
  return normalizeAladhan(d.data);
}

async function fetchAladhanByCoords(lat, lng, method=3) {
  const res = await fetchWithTimeout(`${ALADHAN_BASE}/timings?latitude=${lat}&longitude=${lng}&method=${method}`, 8000);
  const d = await res.json();
  if (d.code!==200) throw new Error('Coords lookup failed');
  return normalizeAladhan(d.data);
}

function normalizeAladhan(d) {
  return {
    timings: d.timings,
    hijri: d.date?.hijri?{day:d.date.hijri.day,month:d.date.hijri.month,year:d.date.hijri.year}:null,
    source: 'Aladhan API',
    date: { readable: d.date?.readable||'' },
    meta: d.meta,
  };
}

// ─── Qibla (local Haversine + API verification) ────────────────────
export function calcQiblaLocal(lat, lng) {
  const ML=21.4225, MLo=39.8262;
  const dL=(MLo-lng)*Math.PI/180, l1=lat*Math.PI/180, l2=ML*Math.PI/180;
  const y=Math.sin(dL)*Math.cos(l2), x=Math.cos(l1)*Math.sin(l2)-Math.sin(l1)*Math.cos(l2)*Math.cos(dL);
  return (Math.atan2(y,x)*180/Math.PI+360)%360;
}

export async function fetchQibla(lat, lng) {
  const local = calcQiblaLocal(lat, lng);
  try {
    const r = await fetchWithTimeout(`${ALADHAN_BASE}/qibla/${lat}/${lng}`, 5000);
    const d = await r.json();
    if (d.code===200 && d.data?.direction) return d.data.direction;
  } catch {}
  return local;
}

// ─── Hijri date ────────────────────────────────────────────────────
export async function fetchHijriDate() {
  const d = new Date();
  const res = await fetchWithTimeout(`${ALADHAN_BASE}/gToH/${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`, 5000);
  const data = await res.json();
  return data.data?.hijri || null;
}

// ─── Schedule native Adzan notifications ─────────────────────────
export async function scheduleAzanNotifications(timings) {
  await cancelAzanNotifications();
  const granted = await requestNotificationPermission();
  if (!granted) return;
  const now = new Date();
  for (const prayer of SALAH) {
    const t = timings[prayer]; if (!t||t==='—') continue;
    const [h,m] = t.split(':').map(Number);
    const prayerDate = new Date(now);
    prayerDate.setHours(h, m, 0, 0);
    if (prayerDate <= now) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: `prayer-${prayer}`,
      content: {
        title: `${prayer} — Waktu Solat`,
        body: `Telah tiba waktu solat ${prayer}. Allahu Akbar.`,
        sound: 'azan.mp3',
        data: { prayer },
      },
      trigger: { date: prayerDate },
    });
  }
}

export async function cancelAzanNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.identifier.startsWith('prayer-')) await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
}

// ─── Helpers ───────────────────────────────────────────────────────
export function getNextPrayer(timings) {
  if (!timings) return null;
  const now=new Date(), cur=now.getHours()*60+now.getMinutes();
  for (const n of SALAH) {
    const t=timings[n]; if(!t||t==='—') continue;
    const [h,m]=t.split(':').map(Number);
    if(h*60+m>cur) return{name:n,time:t,mins:h*60+m};
  }
  const t=timings.Fajr||'05:00'; const [h,m]=t.split(':').map(Number);
  return{name:'Fajr',time:t,mins:h*60+m};
}

export function getCountdown(nextPrayer) {
  if (!nextPrayer) return '—';
  const now=new Date(), cur=now.getHours()*60+now.getMinutes();
  let diff=nextPrayer.mins-cur; if(diff<=0)diff+=1440;
  const h=Math.floor(diff/60), m=diff%60;
  return `in ${h>0?h+'h ':''}${m}min`;
}

async function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try { const r=await fetch(url,{signal:ctrl.signal}); clearTimeout(timer); return r; }
  catch(e){ clearTimeout(timer); throw e; }
}
