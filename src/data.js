// All copy on this page is original, written for this demo project.
// All pictures are AI-generated images stored locally in public/images/
// (no airline assets, no external photo URLs).
//
// Flight search, bookings and flight status now come from the Express API
// (server/); the schedule itself lives in server/flightData.js. Nothing in
// this file generates fake flights anymore.

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
