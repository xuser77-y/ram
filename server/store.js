// Data layer for Atlas Air.
//
// Primary store: real MongoDB via Mongoose (MONGODB_URI, default
// mongodb://localhost:27017/atlasair). If no MongoDB server is reachable,
// createStore() falls back to a clearly-labeled in-memory store behind the
// exact same interface, so the demo still runs — but that fallback is NOT
// MongoDB, and its data resets when the server restarts. The startup log
// always says which store is active. Never claim the fallback is MongoDB.

import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { generateFlights } from './flightData.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/atlasair';

function maskUri(uri) {
  return uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
}

function newReference() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = '';
  const bytes = crypto.randomBytes(6);
  for (const b of bytes) ref += chars[b % chars.length];
  return `AT${ref}`;
}

// ---------------------------------------------------------------- MongoDB --

const flightSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    fromCity: { type: String, required: true },
    toCity: { type: String, required: true },
    dep: { type: String, required: true },
    arr: { type: String, required: true },
    duration: { type: String, required: true },
    durationMins: { type: Number, required: true },
    stops: { type: String, default: 'Nonstop' },
    price: { type: Number, required: true },
  },
  { timestamps: true },
);

const bookingSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    status: { type: String, default: 'Confirmed' },
    tripType: { type: String, default: 'oneway' },
    departDate: { type: String, required: true },
    returnDate: { type: String, default: null },
    flight: {
      number: String,
      from: String,
      to: String,
      fromCity: String,
      toCity: String,
      dep: String,
      arr: String,
      duration: String,
      stops: String,
      price: Number,
    },
    passengers: [
      {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
      },
    ],
    totalPrice: { type: Number, required: true },
  },
  { timestamps: true },
);

const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: '' },
  },
  { timestamps: true },
);

const Flight = mongoose.models.Flight || mongoose.model('Flight', flightSchema);
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
const Subscriber =
  mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);

function flightOut(doc) {
  const f = doc.toObject ? doc.toObject() : doc;
  return { ...f, id: String(f._id) };
}

function bookingOut(doc) {
  const b = doc.toObject ? doc.toObject() : doc;
  return { ...b, id: String(b._id) };
}

class MongoStore {
  async listFlights(from, to) {
    const docs = await Flight.find({ from, to }).sort({ dep: 1 }).lean();
    return docs.map((d) => ({ ...d, id: String(d._id) }));
  }

  async findFlightById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await Flight.findById(id).lean();
    return doc ? { ...doc, id: String(doc._id) } : null;
  }

  async findFlightByNumber(number) {
    const doc = await Flight.findOne({ number: number.toUpperCase() }).lean();
    return doc ? { ...doc, id: String(doc._id) } : null;
  }

  async createBooking({ flight, passengers, tripType, departDate, returnDate }) {
    let reference = newReference();
    while (await Booking.exists({ reference })) reference = newReference();
    const doc = await Booking.create({
      reference,
      status: 'Confirmed',
      tripType: tripType || 'oneway',
      departDate,
      returnDate: returnDate || null,
      flight: {
        number: flight.number,
        from: flight.from,
        to: flight.to,
        fromCity: flight.fromCity,
        toCity: flight.toCity,
        dep: flight.dep,
        arr: flight.arr,
        duration: flight.duration,
        stops: flight.stops,
        price: flight.price,
      },
      passengers,
      totalPrice: flight.price * passengers.length,
    });
    return bookingOut(doc);
  }

  async findBooking(reference, lastName) {
    const doc = await Booking.findOne({ reference: reference.toUpperCase() }).lean();
    if (!doc) return null;
    const wanted = lastName.trim().toLowerCase();
    const match = doc.passengers.some((p) => p.lastName.trim().toLowerCase() === wanted);
    return match ? { ...doc, id: String(doc._id) } : null;
  }

  async createSubscriber(email, name) {
    const existing = await Subscriber.findOne({ email: email.toLowerCase() }).lean();
    if (existing) {
      const err = new Error('duplicate');
      err.code = 'DUPLICATE';
      throw err;
    }
    const doc = await Subscriber.create({ email: email.toLowerCase(), name: name || '' });
    return { id: String(doc._id), email: doc.email, name: doc.name };
  }

  async seedFlights(flights) {
    await Flight.deleteMany({});
    await Flight.insertMany(flights);
    return flights.length;
  }

  async countFlights() {
    return Flight.countDocuments();
  }
}

// ------------------------------------------------------------- In-memory --
// Same interface, plain arrays. Used ONLY when MongoDB is unreachable.
// Data lives for as long as the server process runs, then disappears.

class MemoryStore {
  constructor() {
    this.flights = generateFlights().map((f, i) => ({ ...f, id: `f${i + 1}` }));
    this.bookings = [];
    this.subscribers = [];
    this.bookingSeq = 0;
  }

  async listFlights(from, to) {
    return this.flights
      .filter((f) => f.from === from && f.to === to)
      .sort((a, b) => a.dep.localeCompare(b.dep));
  }

  async findFlightById(id) {
    return this.flights.find((f) => f.id === id) || null;
  }

  async findFlightByNumber(number) {
    return this.flights.find((f) => f.number === number.toUpperCase()) || null;
  }

  async createBooking({ flight, passengers, tripType, departDate, returnDate }) {
    let reference = newReference();
    while (this.bookings.some((b) => b.reference === reference)) reference = newReference();
    const booking = {
      id: `b${++this.bookingSeq}`,
      reference,
      status: 'Confirmed',
      tripType: tripType || 'oneway',
      departDate,
      returnDate: returnDate || null,
      flight: {
        number: flight.number,
        from: flight.from,
        to: flight.to,
        fromCity: flight.fromCity,
        toCity: flight.toCity,
        dep: flight.dep,
        arr: flight.arr,
        duration: flight.duration,
        stops: flight.stops,
        price: flight.price,
      },
      passengers,
      totalPrice: flight.price * passengers.length,
      createdAt: new Date().toISOString(),
    };
    this.bookings.push(booking);
    return booking;
  }

  async findBooking(reference, lastName) {
    const doc = this.bookings.find((b) => b.reference === reference.toUpperCase());
    if (!doc) return null;
    const wanted = lastName.trim().toLowerCase();
    const match = doc.passengers.some((p) => p.lastName.trim().toLowerCase() === wanted);
    return match ? doc : null;
  }

  async createSubscriber(email, name) {
    const lower = email.toLowerCase();
    if (this.subscribers.some((s) => s.email === lower)) {
      const err = new Error('duplicate');
      err.code = 'DUPLICATE';
      throw err;
    }
    const sub = { id: `s${this.subscribers.length + 1}`, email: lower, name: name || '' };
    this.subscribers.push(sub);
    return sub;
  }

  async seedFlights(flights) {
    this.flights = flights.map((f, i) => ({ ...f, id: `f${i + 1}` }));
    return flights.length;
  }

  async countFlights() {
    return this.flights.length;
  }
}

// ------------------------------------------------------------------ Setup --

export async function createStore() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    console.log(`[atlas-air] Connected to MongoDB at ${maskUri(MONGODB_URI)}`);
    return { mode: 'mongo', store: new MongoStore() };
  } catch (err) {
    console.warn(
      `[atlas-air] WARNING: could not connect to MongoDB at ${maskUri(MONGODB_URI)} (${err.message}). ` +
        'Using the in-memory fallback store instead. This is NOT MongoDB: bookings and subscribers ' +
        'reset when the server restarts. Set MONGODB_URI to a MongoDB Atlas cluster for production.',
    );
    return { mode: 'memory', store: new MemoryStore() };
  }
}

export { flightOut, bookingOut };
