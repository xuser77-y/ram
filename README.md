# Atlas Air — Full-Stack Airline Booking Demo

A full-stack airline booking app, built with React + Vite on the front end
and Express + Mongoose on the back end. It recreates the *structure* of a
typical airline site — hero, flight search, destinations, offers and loyalty
section — with original code, original copy and locally generated pictures.

**Demo only — not affiliated with any real airline.** There is no real
checkout or payment flow. Bookings are demo records, not real tickets.

## What works for real

- Flight search against a real API: Casablanca (CMN) hub plus Marrakech,
  Agadir, Tangier, Fes and Dakhla, plus Paris, London, New York, Cairo,
  São Paulo and Istanbul — 3 daily departures per route, MAD fares
- Booking flow: pick a flight, enter passenger details, get a real booking
  reference (e.g. `AT3K7X9Q`) with the total price stored in the database
- Manage / Check-in: look up a booking by reference + last name
- Flight status: deterministic per flight number (On time / Boarding /
  Delayed), served from the API
- Newsletter signup with duplicate detection
- "Book now" on a destination card prefills the search

## API

Base URL in dev: `http://localhost:5000` (the Vite dev server proxies `/api`).

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/flights?from=CMN&to=CDG&date=YYYY-MM-DD&passengers=N` | Search the schedule |
| POST | `/api/bookings` | Create a booking: `{ flightId, passengers: [{firstName, lastName, email}], tripType, departDate, returnDate }` |
| GET | `/api/bookings/:reference?lastName=...` | Look up a booking |
| GET | `/api/flights/:number/status?date=YYYY-MM-DD` | Flight status |
| POST | `/api/newsletter` | Subscribe: `{ email, name? }` (409 if already subscribed) |
| GET | `/api/health` | Health check + active store (`mongo` or `memory`) |

## Run it

```bash
npm install
```

Seed the flight schedule (MongoDB only — see the note below):

```bash
npm run seed
```

Then run the API and the front end in two terminals:

```bash
# Terminal 1 — API on http://localhost:5000
npm run server

# Terminal 2 — front end on http://localhost:5173
npm run dev
```

Build the front end for production:

```bash
npm run build
```

## Database

The API uses MongoDB via Mongoose by default:

```bash
# Local MongoDB (default when MONGODB_URI is unset)
mongodb://localhost:27017/atlasair

# Or point it at MongoDB Atlas for deployment
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/atlasair" npm run server
```

**No MongoDB reachable?** The server logs a warning and runs on a clearly
labeled in-memory fallback store with the same schedule and the same API, so
the demo still works — but that fallback is NOT MongoDB: bookings and
newsletter subscribers reset when the server restarts, and `npm run seed`
does not persist there (the server seeds its own schedule on start). For any
deployment, use a real MongoDB Atlas cluster.

## Stack

React 19 + Vite · Express 4 · Mongoose 8 · MongoDB (or the in-memory
fallback when MongoDB is unreachable).
