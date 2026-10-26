// All copy on this page is original, written for this demo project.
// All pictures are AI-generated images stored locally in public/images/
// (no airline assets, no external photo URLs).

export const AIRPORTS = [
  { code: 'CMN', city: 'Casablanca', country: 'Morocco' },
  { code: 'RAK', city: 'Marrakech', country: 'Morocco' },
  { code: 'AGA', city: 'Agadir', country: 'Morocco' },
  { code: 'TNG', city: 'Tangier', country: 'Morocco' },
  { code: 'FEZ', city: 'Fes', country: 'Morocco' },
  { code: 'VIL', city: 'Dakhla', country: 'Morocco' },
  { code: 'CDG', city: 'Paris', country: 'France' },
  { code: 'LHR', city: 'London', country: 'United Kingdom' },
  { code: 'JFK', city: 'New York', country: 'United States' },
  { code: 'CAI', city: 'Cairo', country: 'Egypt' },
  { code: 'GRU', city: 'Sao Paulo', country: 'Brazil' },
  { code: 'IST', city: 'Istanbul', country: 'Turkey' },
];

export const airportByCode = (code) => AIRPORTS.find((a) => a.code === code);

// Round-trip "from" prices in MAD, shown on destination cards.
export const DESTINATIONS = [
  {
    code: 'CDG',
    city: 'Paris',
    country: 'France',
    price: 2522,
    img: '/images/paris.webp',
  },
  {
    code: 'LHR',
    city: 'London',
    country: 'United Kingdom',
    price: 1476,
    img: '/images/london.webp',
  },
  {
    code: 'JFK',
    city: 'New York',
    country: 'United States',
    price: 9195,
    img: '/images/new-york.webp',
  },
  {
    code: 'CAI',
    city: 'Cairo',
    country: 'Egypt',
    price: 5735,
    img: '/images/cairo.webp',
  },
  {
    code: 'GRU',
    city: 'Sao Paulo',
    country: 'Brazil',
    price: 9569,
    img: '/images/sao-paulo.webp',
  },
  {
    code: 'IST',
    city: 'Istanbul',
    country: 'Turkey',
    price: 4885,
    img: '/images/istanbul.webp',
  },
];

// Hero image (local, generated for this demo).
export const HERO_IMG = '/images/hero.webp';

// Generic fallback if a city photo fails to load.
export const FALLBACK_IMG = '/images/hero.webp';

// Base one-way fares in MAD from the Casablanca hub, used for mock search results.
const BASE_FARE = {
  RAK: 520, AGA: 640, TNG: 780, FEZ: 590, VIL: 1490,
  CDG: 1290, LHR: 790, JFK: 4790, CAI: 2990, GRU: 4990, IST: 2490,
};

const pad = (n) => String(n).padStart(2, '0');

function addMinutes(h, m, mins) {
  const total = h * 60 + m + mins;
  const days = Math.floor(total / 1440);
  const t = ((total % 1440) + 1440) % 1440;
  return { h: Math.floor(t / 60), m: t % 60, days };
}

function fmtTime(h, m) {
  return `${pad(h)}:${pad(m)}`;
}

function fmtDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${pad(m)}m`;
}

// Deterministic mock departures for any route, so results are stable per route.
export function mockFlights(from, to) {
  const key = `${from}${to}`;
  let seed = 0;
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) % 997;
  const base = BASE_FARE[to] ?? 1200;
  const legs = [
    { depH: 7, depM: 45, dur: 145 },
    { depH: 13, depM: 20, dur: 165 },
    { depH: 19, depM: 5, dur: 155 },
  ];
  const isLong = ['JFK', 'GRU'].includes(to);
  return legs.map((leg, i) => {
    const dur = isLong ? leg.dur + 360 + ((seed + i * 37) % 90) : leg.dur + ((seed + i * 29) % 40);
    const arr = addMinutes(leg.depH, leg.depM, dur);
    const price = base + ((seed + i * 173) % 420) + i * 60;
    return {
      id: `AT${100 + ((seed + i * 53) % 800)}`,
      from,
      to,
      dep: fmtTime(leg.depH, leg.depM),
      arr: fmtTime(arr.h, arr.m) + (arr.days ? ' (+1)' : ''),
      duration: fmtDuration(dur),
      stops: 'Nonstop',
      price,
    };
  });
}

// Deterministic mock status for any AT flight number.
export function mockFlightStatus(flightNo, date) {
  const digits = (flightNo.match(/\d+/g) || ['0']).join('');
  const n = parseInt(digits, 10) || 0;
  const statuses = ['On time', 'Boarding', 'Delayed'];
  const status = statuses[n % 3];
  const dests = DESTINATIONS;
  const to = dests[n % dests.length];
  const depH = 8 + (n % 11);
  const depM = (n * 7) % 60;
  const arr = addMinutes(depH, depM, 150 + (n % 120));
  return {
    flight: flightNo.toUpperCase(),
    date: date || '—',
    from: 'CMN',
    to: to.code,
    fromCity: 'Casablanca',
    toCity: to.city,
    dep: fmtTime(depH, depM),
    arr: fmtTime(arr.h, arr.m) + (arr.days ? ' (+1)' : ''),
    status,
    note:
      status === 'Delayed'
        ? 'Departure pushed back by about 45 minutes. Please check the gate screens.'
        : status === 'Boarding'
          ? 'Boarding has started. Please proceed to the gate.'
          : 'Flight is operating as scheduled.',
  };
}

export const OFFERS = [
  {
    tag: 'Long-haul deal',
    title: 'New York from 4,790 MAD',
    text: 'Cross the Atlantic in comfort, with meals and a checked bag included on every long-haul fare.',
  },
  {
    tag: 'City break',
    title: 'Paris weekends from 1,290 MAD',
    text: 'Fly out Friday morning, wander the boulevards, and be home for Sunday dinner.',
  },
  {
    tag: 'Family offer',
    title: 'Kids fly for less to Marrakech',
    text: 'Extra bags and flexible changes on family bookings to the Red City and beyond.',
  },
  {
    tag: 'Business',
    title: 'Work above the clouds',
    text: 'Priority boarding, lounge access and extra legroom on our business fares.',
  },
];

export const PERKS = [
  {
    icon: '🍽️',
    title: 'Meals included on all flights',
    text: 'A hot meal and drinks are part of every ticket — no surprise extras at 35,000 feet.',
  },
  {
    icon: '🧳',
    title: 'Free hold luggage',
    text: 'Every fare includes a checked bag, so you can pack properly for the trip.',
  },
  {
    icon: '📶',
    title: 'Connectivity & entertainment',
    text: 'Stay online and stream films, music and shows from your own device on board.',
  },
  {
    icon: '💺',
    title: 'Extra legroom',
    text: 'Roomier seats and generous pitch, even in economy, for a more relaxed arrival.',
  },
];

export const QUICK_LINKS = ['Flight Pass', 'Upgrade', 'Seat', 'Extra bags', 'E-Skyshop'];
