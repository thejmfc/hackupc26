import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { FlightResult } from '../types/flights';
import FlightResultCard from '../components/FlightResultCard';

const API_URL = 'http://localhost:8000';

export default function FlightSearch() {
    const [origin, setOrigin] = useState('');
    const [dest, setDest] = useState('');
    const [date, setDate] = useState('');
    const [flights, setFlights] = useState<FlightResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function swapAirports() {
        setOrigin(dest);
        setDest(origin);
    }

    async function handleSearch() {
        if (!origin || !dest || !date) return;
        const [y, m, d] = date.split('-').map(Number);
        setLoading(true);
        setError(null);
        setFlights([]);
        setSearched(true);
        try {
            const params = new URLSearchParams({
                origin: origin.toUpperCase(),
                destination: dest.toUpperCase(),
                year: String(y),
                month: String(m),
                day: String(d),
            });
            const res = await fetch(`${API_URL}/flights?${params}`);
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            setFlights(data.flights ?? []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    const canSearch = origin.length === 3 && dest.length === 3 && !!date;

    return (
        <div className="min-h-screen py-16 px-4" style={{ backgroundColor: '#f0e4c0' }}>
            <div className="mx-auto w-full max-w-2xl flex flex-col gap-6">
                <div className="flex items-baseline justify-between">
                    <h1
                        className="text-8xl text-stone-800 tracking-tight"
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                        Sidequest.
                    </h1>
                    <Link
                        to="/generated/sidequests"
                        className="text-sm text-amber-800 hover:text-stone-800 transition-colors"
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                        → Sidequests
                    </Link>
                </div>

                <div
                    className="rounded-xl border border-amber-800/30 p-6 shadow-sm flex flex-col gap-5"
                    style={{ backgroundColor: '#fdf5e4' }}
                >
                    <p
                        className="text-stone-500 text-sm"
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                        Enter IATA airport codes (e.g. LHR, JFK, NRT).
                    </p>

                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label
                                className="block text-xs text-stone-500 uppercase tracking-widest mb-1.5"
                                style={{ fontFamily: "'Instrument Serif', serif" }}
                            >
                                From
                            </label>
                            <input
                                type="text"
                                value={origin}
                                onChange={e => setOrigin(e.target.value.toUpperCase().slice(0, 3))}
                                placeholder="LHR"
                                maxLength={3}
                                className="w-full rounded-xl border border-amber-800/40 px-4 py-3 text-stone-800 placeholder-stone-400 outline-none focus:border-amber-900 focus:ring-2 focus:ring-amber-900/20 transition-colors uppercase font-mono"
                                style={{ backgroundColor: '#f0e4c0' }}
                            />
                        </div>

                        <button
                            onClick={swapAirports}
                            className="mb-0.5 shrink-0 rounded-xl border border-amber-800/30 p-3 hover:bg-amber-800/10 transition-colors text-amber-800 text-lg"
                            style={{ backgroundColor: '#f0e4c0' }}
                            title="Swap airports"
                        >
                            ⇄
                        </button>

                        <div className="flex-1">
                            <label
                                className="block text-xs text-stone-500 uppercase tracking-widest mb-1.5"
                                style={{ fontFamily: "'Instrument Serif', serif" }}
                            >
                                To
                            </label>
                            <input
                                type="text"
                                value={dest}
                                onChange={e => setDest(e.target.value.toUpperCase().slice(0, 3))}
                                placeholder="JFK"
                                maxLength={3}
                                className="w-full rounded-xl border border-amber-800/40 px-4 py-3 text-stone-800 placeholder-stone-400 outline-none focus:border-amber-900 focus:ring-2 focus:ring-amber-900/20 transition-colors uppercase font-mono"
                                style={{ backgroundColor: '#f0e4c0' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            className="block text-xs text-stone-500 uppercase tracking-widest mb-1.5"
                            style={{ fontFamily: "'Instrument Serif', serif" }}
                        >
                            Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="rounded-xl border border-amber-800/40 px-4 py-3 text-stone-800 outline-none focus:border-amber-900 focus:ring-2 focus:ring-amber-900/20 transition-colors"
                            style={{ backgroundColor: '#f0e4c0', fontFamily: "'Instrument Serif', serif" }}
                        />
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={loading || !canSearch}
                        className="w-full rounded-xl px-6 py-4 text-amber-50 font-medium hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        style={{ backgroundColor: '#3d2314', fontFamily: "'Instrument Serif', serif" }}
                    >
                        {loading ? 'Searching...' : 'Search flights'}
                    </button>
                </div>

                {error && <p className="text-red-900 text-sm">{error}</p>}

                {loading && (
                    <div
                        className="text-center text-stone-400 py-8"
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                        Searching for flights...
                    </div>
                )}

                {!loading && flights.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <p
                            className="text-sm text-stone-500"
                            style={{ fontFamily: "'Instrument Serif', serif" }}
                        >
                            {flights.length} result{flights.length !== 1 ? 's' : ''}
                        </p>
                        {flights.map(flight => (
                            <FlightResultCard key={flight.id} flight={flight} />
                        ))}
                    </div>
                )}

                {!loading && searched && flights.length === 0 && !error && (
                    <div
                        className="text-center text-stone-400 py-8"
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                        No flights found for this route and date.
                    </div>
                )}
            </div>
        </div>
    );
}
