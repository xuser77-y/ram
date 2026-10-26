// Flight schedule data for the Atlas Air API.
//
// This mirrors the schedule the front-end demo used (same airports, routes,
// times and MAD fares), now served from the API instead of generated in the
// browser. Casablanca (CMN) is the hub; every ordered pair of airports gets
// three daily nonstop departures.

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

// Destination cards on the homepage (also used for the status fallback route).
export const DESTINATIONS = [
  { code: 'CDG', city: 'Paris' },
  { code: 'LHR', city: 'London' },
  { code: 'JFK', city: 'New York' },
  { code: 'CAI', city: 'Cairo' },
  { code: 'GRU', city: 'Sao Paulo' },
  { code: 'IST', city: 'Istanbul' },
];

// Base one-way fares in MAD, keyed by destination.
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

// Generate the full daily schedule: 3 departures for every ordered pair of
// airports. Flight numbers are deterministic per route, with collisions
// resolved by bumping to the next free number so every number is unique.
export function generateFlights() {
  const flights = [];
  const usedNumbers = new Set();
  const legs = [
    { depH: 7, depM: 45, dur: 145 },
    { depH: 13, depM: 20, dur: 165 },
    { depH: 19, depM: 5, dur: 155 },
  ];
  for (const from of AIRPORTS) {
    for (const to of AIRPORTS) {
      if (from.code === to.code) continue;
      const key = `${from.code}${to.code}`;
      let seed = 0;
      for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) % 997;
      const base = BASE_FARE[to.code] ?? 1200;
      const isLong = ['JFK', 'GRU'].includes(to.code);
      legs.forEach((leg, i) => {
        const dur = isLong
          ? leg.dur + 360 + ((seed + i * 37) % 90)
          : leg.dur + ((seed + i * 29) % 40);
        const arr = addMinutes(leg.depH, leg.depM, dur);
        let num = 100 + ((seed + i * 53) % 800);
        while (usedNumbers.has(`AT${num}`)) num = 100 + ((num - 100 + 1) % 800);
        usedNumbers.add(`AT${num}`);
        flights.push({
          number: `AT${num}`,
          from: from.code,
          to: to.code,
          fromCity: from.city,
          toCity: to.city,
          dep: fmtTime(leg.depH, leg.depM),
          arr: fmtTime(arr.h, arr.m) + (arr.days ? ' (+1)' : ''),
          duration: fmtDuration(dur),
          durationMins: dur,
          stops: 'Nonstop',
          price: base + ((seed + i * 173) % 420) + i * 60,
        });
      });
    }
  }
  return flights;
}

// Deterministic status for a flight number: the same number always yields
// the same status, so status lookups are stable.
export function deterministicStatus(flightNumber) {
  const digits = (flightNumber.match(/\d+/g) || ['0']).join('');
  const n = parseInt(digits, 10) || 0;
  return ['On time', 'Boarding', 'Delayed'][n % 3];
}

export function statusNote(status) {
  if (status === 'Delayed') return 'Departure pushed back by about 45 minutes. Please check the gate screens.';
  if (status === 'Boarding') return 'Boarding has started. Please proceed to the gate.';
  return 'Flight is operating as scheduled.';
}

// Route/times for a flight number that is not in the schedule (e.g. a number
// typed into the status tab that was never seeded). Kept deterministic so the
// status tab always answers instead of failing on unknown numbers.
export function fallbackRoute(flightNumber) {
  const digits = (flightNumber.match(/\d+/g) || ['0']).join('');
  const n = parseInt(digits, 10) || 0;
  const to = DESTINATIONS[n % DESTINATIONS.length];
  const depH = 8 + (n % 11);
  const depM = (n * 7) % 60;
  const arr = addMinutes(depH, depM, 150 + (n % 120));
  return {
    from: 'CMN',
    to: to.code,
    fromCity: 'Casablanca',
    toCity: to.city,
    dep: fmtTime(depH, depM),
    arr: fmtTime(arr.h, arr.m) + (arr.days ? ' (+1)' : ''),
  };
}
