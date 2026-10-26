// Seed the flights collection with the daily schedule from flightData.js.
// Usage: npm run seed  (uses MONGODB_URI when set, else local MongoDB).
// With no MongoDB reachable, the in-memory store is seeded instead — but that
// data lives only in the seeding process, so start the API server afterwards:
// the server auto-seeds its in-memory schedule on start.

import { createStore } from './store.js';
import { generateFlights } from './flightData.js';

const { mode, store } = await createStore();
const flights = generateFlights();
const count = await store.seedFlights(flights);
console.log(`[atlas-air] Seeded ${count} flights (store: ${mode}).`);
if (mode === 'memory') {
  console.log(
    '[atlas-air] Note: in-memory store — this seed does not persist. ' +
      'Run `npm run server` and it seeds its own schedule on start.',
  );
}
process.exit(0);
