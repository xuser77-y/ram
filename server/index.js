// Atlas Air API — Express + Mongoose (with an in-memory fallback store when
// MongoDB is unreachable; see store.js). Serves the React front-end's flight
// search, bookings, flight status and newsletter endpoints.
//
//   MONGODB_URI  MongoDB connection string (default mongodb://localhost:27017/atlasair)
//   PORT         API port (default 5000; the Vite dev server proxies /api here)

import express from 'express';
import cors from 'cors';
import { createStore } from './store.js';
import {
  airportByCode,
  deterministicStatus,
  fallbackRoute,
  statusNote,
} from './flightData.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const { mode, store } = await createStore();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.get('/api/health', async (req, res) => {
  res.json({ ok: true, store: mode, flights: await store.countFlights() });
});

// GET /api/flights?from=CMN&to=CDG&date=2026-11-05&passengers=2
// Flights run daily, so the date does not filter the schedule — it is echoed
// back for the booking. `passengers` is validated but pricing stays per person.
app.get('/api/flights', async (req, res) => {
  const { from, to, date, passengers } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to are required.' });
  if (!airportByCode(from) || !airportByCode(to)) {
    return res.status(400).json({ error: 'Unknown airport code.' });
  }
  if (from === to) {
    return res.status(400).json({ error: 'Departure and arrival airports must be different.' });
  }
  const count = Number(passengers);
  if (passengers !== undefined && (!Number.isInteger(count) || count < 1 || count > 9)) {
    return res.status(400).json({ error: 'passengers must be between 1 and 9.' });
  }
  const flights = await store.listFlights(from, to);
  res.json({ from, to, date: date || null, passengers: passengers ? count : 1, flights });
});

// POST /api/bookings { flightId, passengers: [{firstName, lastName, email}], tripType, departDate, returnDate }
app.post('/api/bookings', async (req, res) => {
  const { flightId, passengers, tripType, departDate, returnDate } = req.body || {};
  if (!flightId) return res.status(400).json({ error: 'flightId is required.' });
  const flight = await store.findFlightById(flightId);
  if (!flight) return res.status(404).json({ error: 'Flight not found.' });
  if (!Array.isArray(passengers) || passengers.length < 1 || passengers.length > 9) {
    return res.status(400).json({ error: 'Provide 1 to 9 passengers.' });
  }
  for (const p of passengers) {
    if (!p.firstName?.trim() || !p.lastName?.trim() || !EMAIL_RE.test(p.email || '')) {
      return res.status(400).json({ error: 'Each passenger needs a first name, last name and valid email.' });
    }
  }
  if (!departDate) return res.status(400).json({ error: 'departDate is required.' });
  const booking = await store.createBooking({
    flight,
    passengers: passengers.map((p) => ({
      firstName: p.firstName.trim(),
      lastName: p.lastName.trim(),
      email: p.email.trim(),
    })),
    tripType,
    departDate,
    returnDate,
  });
  res.status(201).json({ booking });
});

// GET /api/bookings/:reference?lastName=Fikri
app.get('/api/bookings/:reference', async (req, res) => {
  const { lastName } = req.query;
  if (!lastName?.trim()) return res.status(400).json({ error: 'lastName query parameter is required.' });
  const booking = await store.findBooking(req.params.reference, lastName);
  if (!booking) return res.status(404).json({ error: 'No booking found for that reference and last name.' });
  res.json({ booking });
});

// GET /api/flights/:number/status?date=2026-11-05
// Status is deterministic from the flight number, so the same flight always
// reports the same status. Known numbers use their scheduled route; unknown
// numbers get a deterministic fallback route instead of a 404.
app.get('/api/flights/:number/status', async (req, res) => {
  const number = req.params.number.toUpperCase();
  if (!/^AT\d+$/.test(number)) {
    return res.status(400).json({ error: 'Flight number must look like AT452.' });
  }
  const flight = await store.findFlightByNumber(number);
  const route = flight || fallbackRoute(number);
  const status = deterministicStatus(number);
  res.json({
    flight: number,
    date: req.query.date || null,
    from: route.from,
    to: route.to,
    fromCity: route.fromCity,
    toCity: route.toCity,
    dep: route.dep,
    arr: route.arr,
    status,
    note: statusNote(status),
  });
});

// POST /api/newsletter { email, name }
app.post('/api/newsletter', async (req, res) => {
  const { email, name } = req.body || {};
  if (!EMAIL_RE.test(email || '')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  try {
    const subscriber = await store.createSubscriber(email, name);
    res.status(201).json({ subscribed: true, subscriber });
  } catch (err) {
    if (err.code === 'DUPLICATE') {
      return res.status(409).json({ error: 'This email is already subscribed.' });
    }
    throw err;
  }
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[atlas-air] error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`[atlas-air] API listening on http://localhost:${PORT} (store: ${mode})`);
});
