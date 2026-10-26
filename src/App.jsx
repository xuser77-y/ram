import { useMemo, useState } from 'react';
import './App.css';
import {
  AIRPORTS, airportByCode, DESTINATIONS, FALLBACK_IMG, HERO_IMG,
  OFFERS, PERKS, QUICK_LINKS,
} from './data.js';

const NAV_LINKS = ['Book', 'Manage', 'Flight status', 'Offers', 'Loyalty', 'Help'];
const NAV_TARGETS = {
  Book: '#booking', Manage: '#booking', 'Flight status': '#booking',
  Offers: '#offers', Loyalty: '#loyalty', Help: '#footer',
};

const SERVER_DOWN = 'Could not reach the server. Start the API first with: npm run server';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Thin wrapper over the API (proxied to http://localhost:5000 in dev).
// Throws an Error carrying the server's message, or SERVER_DOWN when the
// API is unreachable. It never falls back to fake data.
async function api(path, options) {
  let res;
  try {
    res = await fetch(path, options);
  } catch {
    throw new Error(SERVER_DOWN);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
  return data;
}

export default function App() {
  const [tab, setTab] = useState('booking'); // booking | manage | status
  const [tripType, setTripType] = useState('round');
  const [from, setFrom] = useState('CMN');
  const [to, setTo] = useState('CDG');
  const [depart, setDepart] = useState(todayISO());
  const [ret, setRet] = useState(todayISO());
  const [passengers, setPassengers] = useState(1);
  const [results, setResults] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const [showPassengerForm, setShowPassengerForm] = useState(false);
  const [passengerFields, setPassengerFields] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingConfirmation, setBookingConfirmation] = useState(null);

  const [ref, setRef] = useState('');
  const [lastName, setLastName] = useState('');
  const [bookingCard, setBookingCard] = useState(null);
  const [manageError, setManageError] = useState('');
  const [manageLoading, setManageLoading] = useState(false);

  const [flightNo, setFlightNo] = useState('');
  const [flightDate, setFlightDate] = useState(todayISO());
  const [flightStatus, setFlightStatus] = useState(null);
  const [statusError, setStatusError] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterDone, setNewsletterDone] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [loyaltyDone, setLoyaltyDone] = useState(false);
  const [toast, setToast] = useState('');

  const fromAirport = useMemo(() => airportByCode(from), [from]);
  const toAirport = useMemo(() => airportByCode(to), [to]);

  function showToast(msg) {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(''), 4000);
  }

  function resetBookingFlow() {
    setResults(null);
    setSelected(null);
    setShowPassengerForm(false);
    setPassengerFields([]);
    setBookingError('');
    setBookingConfirmation(null);
  }

  async function handleSearch(e) {
    e.preventDefault();
    resetBookingFlow();
    if (from === to) {
      setSearchError('Departure and arrival airports must be different.');
      return;
    }
    setSearchError('');
    setSearchLoading(true);
    try {
      const data = await api(
        `/api/flights?from=${from}&to=${to}&date=${depart}&passengers=${passengers}`,
      );
      setResults(data.flights);
      document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  }

  function openPassengerForm() {
    setPassengerFields(Array.from({ length: passengers }, () => ({ firstName: '', lastName: '', email: '' })));
    setBookingError('');
    setShowPassengerForm(true);
    document.getElementById('passenger-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updatePassengerField(i, field, value) {
    setPassengerFields((fields) => fields.map((f, j) => (j === i ? { ...f, [field]: value } : f)));
  }

  async function handleBookingSubmit(e) {
    e.preventDefault();
    setBookingError('');
    setBookingLoading(true);
    try {
      const data = await api('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightId: selected.id,
          passengers: passengerFields,
          tripType,
          departDate: depart,
          returnDate: tripType === 'round' ? ret : null,
        }),
      });
      setBookingConfirmation(data.booking);
      setShowPassengerForm(false);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  }

  async function handleManage(e) {
    e.preventDefault();
    if (!ref.trim() || !lastName.trim()) return;
    setManageError('');
    setBookingCard(null);
    setManageLoading(true);
    try {
      const data = await api(
        `/api/bookings/${encodeURIComponent(ref.trim())}?lastName=${encodeURIComponent(lastName.trim())}`,
      );
      const b = data.booking;
      setBookingCard({
        ref: b.reference,
        fromCity: b.flight.fromCity,
        toCity: b.flight.toCity,
        from: b.flight.from,
        to: b.flight.to,
        flight: b.flight.number,
        date: b.departDate,
        passengers: b.passengers.map((p) => `${p.firstName} ${p.lastName}`).join(', '),
        totalPrice: b.totalPrice,
        status: b.status,
      });
    } catch (err) {
      setManageError(err.message);
    } finally {
      setManageLoading(false);
    }
  }

  async function handleStatus(e) {
    e.preventDefault();
    if (!/^AT\d+$/i.test(flightNo.trim())) {
      setFlightStatus(null);
      setStatusError('Enter a flight number like AT452 (letters AT followed by digits).');
      return;
    }
    setStatusError('');
    setFlightStatus(null);
    setStatusLoading(true);
    try {
      const data = await api(
        `/api/flights/${encodeURIComponent(flightNo.trim())}/status?date=${flightDate}`,
      );
      setFlightStatus(data);
    } catch (err) {
      setStatusError(err.message);
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleNewsletter(e) {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterError('');
    setNewsletterLoading(true);
    try {
      await api('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      });
      setNewsletterDone(true);
    } catch (err) {
      setNewsletterError(err.message);
    } finally {
      setNewsletterLoading(false);
    }
  }

  function prefillDestination(code) {
    setFrom('CMN');
    setTo(code);
    setTab('booking');
    resetBookingFlow();
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  }

  const totalPrice = selected ? selected.price * passengers : 0;

  return (
    <div className="page">
      {/* 1. Utility bar + main nav */}
      <div className="utility-bar">
        <span>English · MAD · Morocco</span>
        <span className="utility-links">
          <a href="#loyalty">Safar Flyer</a>
          <a href="#footer">Contact</a>
          <a href="#booking">Sign in</a>
        </span>
      </div>
      <header className="main-nav">
        <a className="wordmark" href="#top">
          <span className="wordmark-mark">A</span> ATLAS AIR
        </a>
        <nav>
          {NAV_LINKS.map((l) => (
            <a key={l} href={NAV_TARGETS[l]} onClick={() => {
              if (l === 'Manage') setTab('manage');
              if (l === 'Flight status') setTab('status');
              if (l === 'Book') setTab('booking');
            }}>{l}</a>
          ))}
        </nav>
        <a className="nav-cta" href="#booking">Book a flight</a>
      </header>

      {/* 2. Hero + search widget */}
      <section className="hero" id="top">
        <img className="hero-img" src={HERO_IMG} alt="Airplane wing above the clouds at sunset" />
        <div className="hero-overlay">
          <h1>Fly further, travel beautifully</h1>
          <p>From Casablanca to the world — simple fares, generous bags, and a warm welcome on board.</p>
        </div>

        <div className="search-widget" id="booking">
          <div className="tabs" role="tablist">
            {[
              ['booking', 'Booking'],
              ['manage', 'Manage / Check-in'],
              ['status', 'Flight Status'],
            ].map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                className={tab === key ? 'active' : ''}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'booking' && (
            <form className="search-form" onSubmit={handleSearch}>
              <div className="trip-toggle">
                <label>
                  <input type="radio" name="trip" checked={tripType === 'round'} onChange={() => setTripType('round')} />
                  Round trip
                </label>
                <label>
                  <input type="radio" name="trip" checked={tripType === 'oneway'} onChange={() => setTripType('oneway')} />
                  One way
                </label>
              </div>
              <div className="form-grid">
                <label>
                  From
                  <select value={from} onChange={(e) => setFrom(e.target.value)}>
                    {AIRPORTS.map((a) => (
                      <option key={a.code} value={a.code}>{a.city} ({a.code})</option>
                    ))}
                  </select>
                </label>
                <label>
                  To
                  <select value={to} onChange={(e) => setTo(e.target.value)}>
                    {AIRPORTS.map((a) => (
                      <option key={a.code} value={a.code}>{a.city} ({a.code})</option>
                    ))}
                  </select>
                </label>
                <label>
                  Depart
                  <input type="date" value={depart} onChange={(e) => setDepart(e.target.value)} required />
                </label>
                <label>
                  Return
                  <input type="date" value={ret} onChange={(e) => setRet(e.target.value)} disabled={tripType === 'oneway'} required={tripType === 'round'} />
                </label>
                <label>
                  Passengers
                  <select value={passengers} onChange={(e) => setPassengers(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n} {n === 1 ? 'adult' : 'adults'}</option>
                    ))}
                  </select>
                </label>
              </div>
              {searchError && <p className="form-error">{searchError}</p>}
              <button className="btn-primary" type="submit" disabled={searchLoading}>
                {searchLoading ? 'Searching…' : 'Search flights'}
              </button>
            </form>
          )}

          {tab === 'manage' && (
            <form className="search-form" onSubmit={handleManage}>
              <p className="form-hint">Enter your booking reference and last name to view your trip.</p>
              <div className="form-grid two-col">
                <label>
                  Booking reference
                  <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. AT3K7X9Q" required />
                </label>
                <label>
                  Last name
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Fikri" required />
                </label>
              </div>
              {manageError && <p className="form-error">{manageError}</p>}
              <button className="btn-primary" type="submit" disabled={manageLoading}>
                {manageLoading ? 'Looking up…' : 'Find my booking'}
              </button>
              {bookingCard && (
                <div className="booking-card">
                  <div>
                    <strong>{bookingCard.fromCity} ({bookingCard.from}) → {bookingCard.toCity} ({bookingCard.to})</strong>
                    <p>Flight {bookingCard.flight} · {bookingCard.date} · Passengers: {bookingCard.passengers}</p>
                    <p>Reference: {bookingCard.ref} · Total: {bookingCard.totalPrice.toLocaleString()} MAD</p>
                  </div>
                  <span className="status-pill ok">{bookingCard.status}</span>
                </div>
              )}
            </form>
          )}

          {tab === 'status' && (
            <form className="search-form" onSubmit={handleStatus}>
              <p className="form-hint">Check the live status of any flight, for example AT452.</p>
              <div className="form-grid two-col">
                <label>
                  Flight number
                  <input value={flightNo} onChange={(e) => setFlightNo(e.target.value)} placeholder="e.g. AT452" required />
                </label>
                <label>
                  Date
                  <input type="date" value={flightDate} onChange={(e) => setFlightDate(e.target.value)} required />
                </label>
              </div>
              {statusError && <p className="form-error">{statusError}</p>}
              <button className="btn-primary" type="submit" disabled={statusLoading}>
                {statusLoading ? 'Checking…' : 'Check status'}
              </button>
              {flightStatus && (
                <div className="booking-card">
                  <div>
                    <strong>{flightStatus.flight} · {flightStatus.fromCity} ({flightStatus.from}) → {flightStatus.toCity} ({flightStatus.to})</strong>
                    <p>Departs {flightStatus.dep} · Arrives {flightStatus.arr} · {flightStatus.date || '—'}</p>
                    <p>{flightStatus.note}</p>
                  </div>
                  <span className={`status-pill ${flightStatus.status === 'Delayed' ? 'warn' : 'ok'}`}>{flightStatus.status}</span>
                </div>
              )}
            </form>
          )}
        </div>
      </section>

      {/* Search results */}
      {results && (
        <section className="results" id="search-results">
          <h2>
            {fromAirport.city} ({from}) → {toAirport.city} ({to}) · {depart}
            {tripType === 'round' ? ` · return ${ret}` : ' · one way'} · {passengers} {passengers === 1 ? 'passenger' : 'passengers'}
          </h2>
          <p className="results-note">Fares in MAD, per person, from the live schedule. Select a flight to book it.</p>
          <div className="flight-list">
            {results.map((f) => (
              <button
                key={f.id}
                className={`flight-row ${selected?.id === f.id ? 'selected' : ''}`}
                onClick={() => { setSelected(f); setShowPassengerForm(false); setBookingConfirmation(null); }}
              >
                <span className="flight-no">{f.number}</span>
                <span className="flight-times">{f.dep} → {f.arr}</span>
                <span className="flight-meta">{f.duration} · {f.stops}</span>
                <span className="flight-price">{f.price.toLocaleString()} MAD</span>
              </button>
            ))}
          </div>

          {selected && !bookingConfirmation && (
            <div className="trip-summary">
              <h3>Your trip summary</h3>
              <p><strong>{selected.number}</strong> · {fromAirport.city} ({from}) → {toAirport.city} ({to})</p>
              <p>Departure {depart} at {selected.dep} · Arrival {selected.arr} · {selected.duration} · {selected.stops}</p>
              <p>{passengers} × {selected.price.toLocaleString()} MAD = <strong>{totalPrice.toLocaleString()} MAD</strong></p>
              {tripType === 'round' && <p>Return date: {ret} (return flight selection is not part of this booking).</p>}
              {!showPassengerForm && (
                <button className="btn-primary" onClick={openPassengerForm}>
                  Continue to booking
                </button>
              )}
            </div>
          )}

          {selected && showPassengerForm && !bookingConfirmation && (
            <form className="search-form" id="passenger-form" onSubmit={handleBookingSubmit}>
              <h3>Passenger details</h3>
              {passengerFields.map((p, i) => (
                <div className="form-grid" key={i}>
                  <label>
                    Passenger {i + 1} — first name
                    <input value={p.firstName} onChange={(e) => updatePassengerField(i, 'firstName', e.target.value)} required />
                  </label>
                  <label>
                    Last name
                    <input value={p.lastName} onChange={(e) => updatePassengerField(i, 'lastName', e.target.value)} required />
                  </label>
                  <label>
                    Email
                    <input type="email" value={p.email} onChange={(e) => updatePassengerField(i, 'email', e.target.value)} required />
                  </label>
                </div>
              ))}
              {bookingError && <p className="form-error">{bookingError}</p>}
              <button className="btn-primary" type="submit" disabled={bookingLoading}>
                {bookingLoading ? 'Booking…' : `Confirm booking — ${totalPrice.toLocaleString()} MAD`}
              </button>
            </form>
          )}

          {bookingConfirmation && (
            <div className="trip-summary">
              <h3>Booking confirmed</h3>
              <p>Your booking reference is <strong>{bookingConfirmation.reference}</strong> — keep it to manage or check in.</p>
              <p><strong>{bookingConfirmation.flight.number}</strong> · {bookingConfirmation.flight.fromCity} ({bookingConfirmation.flight.from}) → {bookingConfirmation.flight.toCity} ({bookingConfirmation.flight.to})</p>
              <p>Departure {bookingConfirmation.departDate} at {bookingConfirmation.flight.dep} · Arrival {bookingConfirmation.flight.arr} · {bookingConfirmation.flight.duration}</p>
              <p>Passengers: {bookingConfirmation.passengers.map((p) => `${p.firstName} ${p.lastName}`).join(', ')}</p>
              <p>Total paid (demo — no payment taken): <strong>{bookingConfirmation.totalPrice.toLocaleString()} MAD</strong></p>
              <span className="status-pill ok">{bookingConfirmation.status}</span>
              <div>
                <button className="btn-primary" onClick={resetBookingFlow}>Book another flight</button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. Quick links */}
      <section className="quick-links">
        {QUICK_LINKS.map((q) => (
          <button key={q} onClick={() => showToast(`"${q}" is illustrative in this demo — it becomes available after a booking.`)}>
            {q}
          </button>
        ))}
      </section>

      {/* 4. Destinations */}
      <section className="section" id="destinations">
        <h2>Start your journey, we make it memorable</h2>
        <p className="section-sub">Round-trip fares from Casablanca, per person, in MAD.</p>
        <div className="card-grid">
          {DESTINATIONS.map((d) => (
            <article className="dest-card" key={d.code}>
              <img
                src={d.img}
                alt={`${d.city}, ${d.country}`}
                loading="lazy"
                onError={(e) => { if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG; }}
              />
              <div className="dest-body">
                <h3>{d.city}, {d.country}</h3>
                <p>Round trip from <strong>{d.price.toLocaleString()} MAD</strong></p>
                <button className="btn-outline" onClick={() => prefillDestination(d.code)}>Book now</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 5. Offers */}
      <section className="section alt" id="offers">
        <h2>Offers and Updates</h2>
        <div className="card-grid offers-grid">
          {OFFERS.map((o) => (
            <article className="offer-card" key={o.title}>
              <span className="offer-tag">{o.tag}</span>
              <h3>{o.title}</h3>
              <p>{o.text}</p>
              <button className="btn-text" onClick={() => { prefillDestination('CDG'); }}>See fares →</button>
            </article>
          ))}
        </div>
      </section>

      {/* 6. Perks */}
      <section className="section">
        <h2>What makes flying with us great</h2>
        <div className="perk-grid">
          {PERKS.map((p) => (
            <article className="perk" key={p.title}>
              <span className="perk-icon">{p.icon}</span>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 7. Loyalty */}
      <section className="loyalty" id="loyalty">
        <div>
          <h2>Safar Flyer</h2>
          <p>Every trip earns miles. Every mile brings the next journey closer — upgrades, extra bags, lounge days and free flights.</p>
          <div className="loyalty-cols">
            <div><strong>Earn miles</strong><p>Collect miles on every flight and with partner hotels and car rentals.</p></div>
            <div><strong>Redeem miles</strong><p>Spend miles on award tickets, upgrades and extra services.</p></div>
          </div>
          {loyaltyDone
            ? <p className="success">Welcome to Safar Flyer! Your demo membership is ready — check your inbox for details.</p>
            : <button className="btn-light" onClick={() => setLoyaltyDone(true)}>Join now</button>}
        </div>
      </section>

      {/* 8. Newsletter */}
      <section className="section newsletter">
        <h2>Travel news, straight to your inbox</h2>
        <p className="section-sub">New routes, fare drops and member offers — once a month, no spam.</p>
        {newsletterDone
          ? <p className="success">Thanks for subscribing! You will receive our next newsletter.</p>
          : (
            <form className="newsletter-form" onSubmit={handleNewsletter}>
              <input
                type="email"
                placeholder="Your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
              />
              <button className="btn-primary" type="submit" disabled={newsletterLoading}>
                {newsletterLoading ? 'Subscribing…' : 'Subscribe'}
              </button>
              {newsletterError && <p className="form-error">{newsletterError}</p>}
            </form>
          )}
      </section>

      {/* 9. App download + footer */}
      <section className="app-section">
        <div>
          <h2>Your trip, in your pocket</h2>
          <p>Book, check in and follow your flight from the app — boarding passes offline, live status and trip alerts.</p>
          <div className="store-buttons">
            <button onClick={() => showToast('Demo: app store links are illustrative only.')}> Download on the App Store</button>
            <button onClick={() => showToast('Demo: app store links are illustrative only.')}>▶ Get it on Google Play</button>
          </div>
        </div>
      </section>

      <footer className="footer" id="footer">
        <div className="footer-cols">
          <div>
            <strong>ATLAS AIR</strong>
            <p>A demo airline booking homepage built for learning.</p>
          </div>
          <div>
            <strong>Explore</strong>
            <p><a href="#destinations">Destinations</a><br /><a href="#offers">Offers</a><br /><a href="#loyalty">Safar Flyer</a></p>
          </div>
          <div>
            <strong>Help</strong>
            <p><a href="#booking">Manage booking</a><br /><a href="#booking">Flight status</a><br /><a href="#booking">Check-in</a></p>
          </div>
        </div>
        <p className="disclaimer">Demo project for learning purposes, not affiliated with Royal Air Maroc.</p>
      </footer>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
