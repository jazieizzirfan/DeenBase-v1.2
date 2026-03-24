/**
 * Waktu Solat Malaysia API Service
 * Source: api.waktusolat.app (data from JAKIM e-Solat — most accurate for Malaysia)
 * Fallback: api.aladhan.com (for non-Malaysian zones or if primary fails)
 *
 * API v2 returns epoch timestamps per prayer, per day.
 * GET https://api.waktusolat.app/v2/solat/{zone}
 * GET https://api.waktusolat.app/zones
 */

const WAKTU_BASE = 'https://api.waktusolat.app';
const ALADHAN_BASE = 'https://api.aladhan.com/v1';

// ─── Malaysian zone map ────────────────────────────────────────────
// Maps common city/state names → zone codes
export const MY_ZONES = {
  // WLY - Wilayah Persekutuan
  'Kuala Lumpur':      'WLY01',
  'KL':                'WLY01',
  'Putrajaya':         'WLY02',
  'Labuan':            'WLY03',
  // SGR - Selangor
  'Shah Alam':         'SGR01',
  'Selangor':          'SGR01',
  'Petaling Jaya':     'SGR01',
  'Klang':             'SGR02',
  'Sepang':            'SGR02',
  'Gombak':            'SGR01',
  'Subang':            'SGR01',
  'Ampang':            'SGR01',
  'Rawang':            'SGR03',
  'Kuala Selangor':    'SGR04',
  'Sabak Bernam':      'SGR05',
  'Hulu Selangor':     'SGR03',
  'Kuala Langat':      'SGR07',
  // JHR - Johor
  'Johor Bahru':       'JHR01',
  'JB':                'JHR01',
  'Johor':             'JHR01',
  'Muar':              'JHR05',
  'Batu Pahat':        'JHR04',
  'Kluang':            'JHR06',
  'Segamat':           'JHR03',
  'Mersing':           'JHR07',
  'Pontian':           'JHR02',
  // KDH - Kedah
  'Alor Setar':        'KDH01',
  'Kedah':             'KDH01',
  'Langkawi':          'KDH07',
  'Sungai Petani':     'KDH02',
  'Kulim':             'KDH03',
  // KTN - Kelantan
  'Kota Bharu':        'KTN01',
  'Kelantan':          'KTN01',
  // MLK - Melaka
  'Melaka':            'MLK01',
  'Malacca':           'MLK01',
  // NSN - Negeri Sembilan
  'Seremban':          'NSN01',
  'Negeri Sembilan':   'NSN01',
  'Port Dickson':      'NSN02',
  // PHG - Pahang
  'Kuantan':           'PHG01',
  'Pahang':            'PHG01',
  'Temerloh':          'PHG02',
  'Cameron Highlands': 'PHG05',
  'Bentong':           'PHG03',
  // PNG - Pulau Pinang
  'Penang':            'PNG01',
  'Pulau Pinang':      'PNG01',
  'George Town':       'PNG01',
  // PRK - Perak
  'Ipoh':              'PRK01',
  'Perak':             'PRK01',
  'Taiping':           'PRK02',
  'Teluk Intan':       'PRK03',
  // PLS - Perlis
  'Kangar':            'PLS01',
  'Perlis':            'PLS01',
  // SBH - Sabah
  'Kota Kinabalu':     'SBH01',
  'Sabah':             'SBH01',
  'Sandakan':          'SBH04',
  'Tawau':             'SBH07',
  // SWK - Sarawak
  'Kuching':           'SWK01',
  'Sarawak':           'SWK01',
  'Miri':              'SWK07',
  'Sibu':              'SWK04',
  'Bintulu':           'SWK05',
  // TRG - Terengganu
  'Kuala Terengganu':  'TRG01',
  'Terengganu':        'TRG01',
};

// Full zone list with display names
export const ZONE_LIST = [
  { code:'WLY01', name:'Kuala Lumpur, Putrajaya' },
  { code:'WLY02', name:'Putrajaya (zone 2)' },
  { code:'WLY03', name:'Labuan' },
  { code:'SGR01', name:'Gombak, Hulu Langat, Petaling, Sepang, Hulu Selangor (part)' },
  { code:'SGR02', name:'Kuala Langat, Kuala Selangor, Sabak Bernam (part)' },
  { code:'SGR03', name:'Rawang, Hulu Selangor (part)' },
  { code:'SGR04', name:'Kuala Selangor (part)' },
  { code:'SGR05', name:'Sabak Bernam' },
  { code:'SGR06', name:'Klang, Shah Alam' },
  { code:'SGR07', name:'Kuala Langat (part)' },
  { code:'JHR01', name:'Pulau Aur, Pulau Pemanggil' },
  { code:'JHR02', name:'Johor Bahru, Pontian' },
  { code:'JHR03', name:'Segamat, Gemas' },
  { code:'JHR04', name:'Batu Pahat' },
  { code:'JHR05', name:'Muar' },
  { code:'JHR06', name:'Kluang, Kulai' },
  { code:'JHR07', name:'Mersing' },
  { code:'JHR08', name:'Kota Tinggi, Pasir Gudang' },
  { code:'KDH01', name:'Kota Setar, Kubang Pasu, Pokok Sena' },
  { code:'KDH02', name:'Sungai Petani, Kuala Muda, Yan' },
  { code:'KDH03', name:'Kulim, Bandar Baharu' },
  { code:'KDH04', name:'Baling' },
  { code:'KDH05', name:'Sik, Belit' },
  { code:'KDH06', name:'Pendang' },
  { code:'KDH07', name:'Langkawi' },
  { code:'KDH08', name:'Padang Terap, Pedu' },
  { code:'KTN01', name:'Kota Bharu, Bachok, Pasir Mas, Tumpat' },
  { code:'KTN02', name:'Gua Musang (Ulu Kelantan), Jeli' },
  { code:'MLK01', name:'Seluruh Melaka' },
  { code:'NSN01', name:'Jelebu, Kuala Pilah, Tampin, Rembau, Seremban' },
  { code:'NSN02', name:'Port Dickson, Nilai, Bahau' },
  { code:'PHG01', name:'Kuantan, Pekan, Rompin, Muadzam Shah' },
  { code:'PHG02', name:'Jerantut, Temerloh, Maran, Bera, Chenor, Jengka' },
  { code:'PHG03', name:'Bentong, Lipis, Raub' },
  { code:'PHG04', name:'Genting Highlands, Bukit Tinggi' },
  { code:'PHG05', name:'Cameron Highlands, Gua Musang (Kelantan)' },
  { code:'PHG06', name:'Mersing, Endau, Rompin (Johor)' },
  { code:'PNG01', name:'Seluruh Pulau Pinang' },
  { code:'PRK01', name:'Tapah, Slim River, Tanjung Malim' },
  { code:'PRK02', name:'Kuala Kangsar, Sg Siput, Taiping, Lenggong, Pengkalan Hulu' },
  { code:'PRK03', name:'Ipoh, Batu Gajah, Chemor, Sungai Rapat' },
  { code:'PRK04', name:'Teluk Intan, Bagan Datuk, Sri Iskandar' },
  { code:'PRK05', name:'Bertam, Lahad Datu (Sabah)' },
  { code:'PRK06', name:'Selama, Parit Buntar, Bagan Serai' },
  { code:'PRK07', name:'Bukit Larut' },
  { code:'PRK08', name:'Pengkalan Hulu (part)' },
  { code:'PLS01', name:'Seluruh Perlis' },
  { code:'SBH01', name:'Kota Kinabalu, Penampang, Papar' },
  { code:'SBH02', name:'Ranau, Kota Belud, Tuaran' },
  { code:'SBH03', name:'Beaufort, Kuala Penyu, Sipitang' },
  { code:'SBH04', name:'Sandakan, Kinabatangan, Beluran' },
  { code:'SBH05', name:'Lahad Datu, Semporna, Kunak, Silam' },
  { code:'SBH06', name:'Keningau, Tenom, Nabawan' },
  { code:'SBH07', name:'Tawau, Kalabakan' },
  { code:'SWK01', name:'Kuching, Samarahan, Serian, Lundu, Bau' },
  { code:'SWK02', name:'Sri Aman, Betong, Lubok Antu' },
  { code:'SWK03', name:'Sarikei, Meradong' },
  { code:'SWK04', name:'Sibu, Dalat, Mukah' },
  { code:'SWK05', name:'Bintulu, Tatau' },
  { code:'SWK06', name:'Kapit, Song, Belaga' },
  { code:'SWK07', name:'Miri, Marudi' },
  { code:'SWK08', name:'Limbang, Lawas, Sundar, Trusan' },
  { code:'SWK09', name:'Limbang (part)' },
  { code:'SWK10', name:'Julau, Engkelili' },
  { code:'SWK11', name:'Selangau' },
  { code:'TRG01', name:'Kuala Terengganu, Marang, Kuala Nerus' },
  { code:'TRG02', name:'Besut, Setiu' },
  { code:'TRG03', name:'Kemaman, Dungun' },
  { code:'TRG04', name:'Hulu Terengganu, Kuala Berang' },
];

// ─── Epoch → HH:MM ────────────────────────────────────────────────
function epochToTime(epoch) {
  if (!epoch) return null;
  const d = new Date(epoch * 1000);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ─── Resolve zone from city name ───────────────────────────────────
export function resolveZone(cityName) {
  if (!cityName) return 'WLY01';
  const q = cityName.trim();
  // Exact match
  const exact = MY_ZONES[q];
  if (exact) return exact;
  // Case-insensitive
  const lower = q.toLowerCase();
  for (const [k, v] of Object.entries(MY_ZONES)) {
    if (k.toLowerCase() === lower) return v;
  }
  // Partial match
  for (const [k, v] of Object.entries(MY_ZONES)) {
    if (k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase())) return v;
  }
  // Zone code directly (e.g. "SGR01")
  if (/^[A-Z]{2,3}\d{2}$/i.test(q)) return q.toUpperCase();
  return null; // not found — fall back to Aladhan
}

// ─── Fetch prayer times for a Malaysian zone ──────────────────────
export async function fetchWaktuSolatByZone(zone) {
  const url = `${WAKTU_BASE}/v2/solat/${zone.toUpperCase()}`;
  const res = await fetchWithTimeout(url, 8000);
  if (!res.ok) throw new Error(`Zone ${zone} not found`);
  const data = await res.json();
  if (!data.prayers || !data.prayers.length) throw new Error('No prayer data returned');

  // Get today's prayer row
  const today = new Date().getDate();
  const row = data.prayers.find(p => p.day === today) || data.prayers[0];
  if (!row) throw new Error('No prayer data for today');

  // Build unified timings object (matching Aladhan format)
  const timings = {
    Imsak:   epochToTime(row.fajr - 600) || '—', // 10 min before Fajr
    Fajr:    epochToTime(row.fajr),
    Sunrise: epochToTime(row.syuruk),
    Dhuhr:   epochToTime(row.dhuhr),
    Asr:     epochToTime(row.asr),
    Sunset:  epochToTime(row.maghrib - 120) || epochToTime(row.maghrib),
    Maghrib: epochToTime(row.maghrib),
    Isha:    epochToTime(row.isha),
    Midnight: '—',
  };

  // Hijri from row
  const hijri = row.hijri ? parseHijri(row.hijri) : null;

  return {
    timings,
    hijri,
    zone: data.zone,
    source: 'waktusolat.app (JAKIM)',
    date: {
      readable: new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    },
    meta: {
      method: { name: `JAKIM · ${zone.toUpperCase()}` },
      zone: data.zone,
    },
  };
}

// ─── Parse "1445-08-20" or "20 Sha'ban 1445" hijri string ─────────
function parseHijri(h) {
  if (!h) return null;
  // Could be "1445-08-20" format
  if (h.includes('-')) {
    const [y, m, d] = h.split('-');
    const MONTHS_EN = ['Muharram','Safar',"Rabi' al-Awwal","Rabi' al-Akhir","Jumada al-Ula","Jumada al-Akhirah",'Rajab',"Sha'ban",'Ramadan','Shawwal',"Dhu al-Qi'dah","Dhu al-Hijjah"];
    const MONTHS_AR = ['مُحَرَّم','صَفَر','رَبِيعُ ٱلْأَوَّل','رَبِيعُ ٱلثَّانِي','جُمَادَىٰ ٱلْأُولَىٰ','جُمَادَىٰ ٱلثَّانِيَة','رَجَب','شَعْبَان','رَمَضَان','شَوَّال','ذُو ٱلْقَعْدَة','ذُو ٱلْحِجَّة'];
    const mi = parseInt(m, 10) - 1;
    return { day: d, month: { en: MONTHS_EN[mi] || m, ar: MONTHS_AR[mi] || m }, year: y };
  }
  return { day: h, month: { en: '', ar: '' }, year: '' };
}

// ─── Auto-detect zone from GPS coordinates ────────────────────────
export async function fetchWaktuSolatByCoords(lat, lng) {
  // Use nearest zone detection via Nominatim reverse geocode
  try {
    const r = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      5000
    );
    const geo = await r.json();
    const city = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.county || '';
    const country = geo.address?.country_code?.toUpperCase() || '';

    if (country === 'MY') {
      const zone = resolveZone(city);
      if (zone) return fetchWaktuSolatByZone(zone);
    }
  } catch {}
  // Fallback to Aladhan for non-MY or unresolved
  return fetchAladhanByCoords(lat, lng);
}

// ─── Aladhan fallbacks ────────────────────────────────────────────
export async function fetchAladhanByCity(city, country, method = 3) {
  const url = `${ALADHAN_BASE}/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;
  const res = await fetchWithTimeout(url, 8000);
  const data = await res.json();
  if (data.code !== 200) throw new Error(data.data || 'City not found');
  return normalizeAladhan(data.data);
}

export async function fetchAladhanByCoords(lat, lng, method = 3) {
  const url = `${ALADHAN_BASE}/timings?latitude=${lat}&longitude=${lng}&method=${method}`;
  const res = await fetchWithTimeout(url, 8000);
  const data = await res.json();
  if (data.code !== 200) throw new Error('Coords lookup failed');
  return normalizeAladhan(data.data);
}

function normalizeAladhan(d) {
  return {
    timings: d.timings,
    hijri: d.date?.hijri ? {
      day: d.date.hijri.day,
      month: d.date.hijri.month,
      year: d.date.hijri.year,
    } : null,
    source: 'Aladhan API',
    date: { readable: d.date?.readable || '' },
    meta: d.meta,
  };
}

// ─── Smart fetch: MY cities use JAKIM, others use Aladhan ─────────
export async function fetchPrayerSmart(city, country = 'MY') {
  const isMY = country.toUpperCase() === 'MY' || country.toUpperCase() === 'MALAYSIA';

  if (isMY) {
    const zone = resolveZone(city);
    if (zone) {
      try { return await fetchWaktuSolatByZone(zone); }
      catch {}
    }
    // Try Aladhan MY as backup
    try { return await fetchAladhanByCity(city, 'MY', 11); } catch {}
  }

  // Non-MY: use Aladhan
  return fetchAladhanByCity(city, country, 3);
}

export async function fetchPrayerByCoordsSmart(lat, lng) {
  // Try to detect MY zone first
  try { return await fetchWaktuSolatByCoords(lat, lng); }
  catch {}
  // Aladhan fallback
  return fetchAladhanByCoords(lat, lng, 11);
}

// ─── Qibla ─────────────────────────────────────────────────────────
export async function fetchQibla(lat, lng) {
  const local = calcQiblaLocal(lat, lng);
  try {
    const r = await fetchWithTimeout(`${ALADHAN_BASE}/qibla/${lat}/${lng}`, 5000);
    const d = await r.json();
    if (d.code === 200 && d.data?.direction) return d.data.direction;
  } catch {}
  return local;
}

export function calcQiblaLocal(lat, lng) {
  const ML = 21.4225, MLo = 39.8262;
  const dLng = (MLo - lng) * Math.PI / 180;
  const l1 = lat * Math.PI / 180, l2 = ML * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(l2);
  const x = Math.cos(l1) * Math.sin(l2) - Math.sin(l1) * Math.cos(l2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// ─── Helpers ────────────────────────────────────────────────────────
async function fetchWithTimeout(url, ms = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

export function getNextPrayer(timings) {
  const SALAH = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
  if (!timings) return null;
  const now = new Date(), cur = now.getHours() * 60 + now.getMinutes();
  for (const name of SALAH) {
    const t = timings[name]; if (!t || t === '—') continue;
    const [h, m] = t.split(':').map(Number);
    if (h * 60 + m > cur) return { name, time: t, mins: h * 60 + m };
  }
  const t = timings.Fajr || '05:00';
  const [h, m] = t.split(':').map(Number);
  return { name: 'Fajr', time: t, mins: h * 60 + m };
}
