import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { AirportOption, FlightResult } from '../types/flights';
import FlightResultCard from '../components/FlightResultCard';

async function fetchAirports(query: string): Promise<AirportOption[]> {
    if (query.trim().length < 2) return [];
    const res = await fetch(`http://localhost:8000/airports?query=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? []).slice(0, 6).map((item: any) => ({
        skyId: item.skyId,
        entityId: item.entityId,
        name: item.presentation?.title ?? item.skyId,
        subtitle: item.presentation?.subtitle ?? '',
    }));
}

interface AirportInputProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    onSelect: (airport: AirportOption) => void;
    suggestions: AirportOption[];
    placeholder: string;
}

function AirportInput({ label, value, onChange, onSelect, suggestions, placeholder }: AirportInputProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex-1 relative">
            <label
                className="block text-xs text-stone-500 uppercase tracking-widest mb-1.5"
                style={{ fontFamily: "'Instrument Serif', serif" }}
            >
                {label}
            </label>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setIsOpen(false)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-amber-800/40 px-4 py-3 text-stone-800 placeholder-stone-400 outline-none focus:border-amber-900 focus:ring-2 focus:ring-amber-900/20 transition-colors"
                style={{ backgroundColor: '#f0e4c0', fontFamily: "'Instrument Serif', serif" }}
            />
            {isOpen && suggestions.length > 0 && (
                <div
                    className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl shadow-lg border border-amber-800/20 overflow-hidden"
                    style={{ backgroundColor: '#fdf5e4' }}
                >
                    {suggestions.map(airport => (
                        <button
                            key={airport.entityId}
                            onMouseDown={() => onSelect(airport)}
                            className="w-full text-left px-4 py-3 hover:bg-amber-800/10 transition-colors flex items-center justify-between border-b border-amber-800/10 last:border-0"
                        >
                            <div>
                                <span
                                    className="text-stone-800 text-sm"
                                    style={{ fontFamily: "'Instrument Serif', serif" }}
                                >
                                    {airport.name}
                                </span>
                                {airport.subtitle && (
                                    <span className="text-stone-400 text-xs ml-2">{airport.subtitle}</span>
                                )}
                            </div>
                            <span className="text-xs font-mono text-amber-800 font-semibold ml-4 shrink-0">
                                {airport.skyId}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FlightSearch() {
    const [origin, setOrigin] = useState<AirportOption | null>(null);
    const [dest, setDest] = useState<AirportOption | null>(null);
    const [originInput, setOriginInput] = useState('');
    const [destInput, setDestInput] = useState('');
    const [originSuggestions, setOriginSuggestions] = useState<AirportOption[]>([]);
    const [destSuggestions, setDestSuggestions] = useState<AirportOption[]>([]);
    const [date, setDate] = useState('');
    const [flights, setFlights] = useState<FlightResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const originTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const destTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    function handleOriginChange(val: string) {
        setOriginInput(val);
        setOrigin(null);
        if (originTimer.current) clearTimeout(originTimer.current);
        if (val.trim().length < 2) { setOriginSuggestions([]); return; }
        originTimer.current = setTimeout(async () => {
            const results = await fetchAirports(val);
            setOriginSuggestions(results);
        }, 400);
    }

    function handleDestChange(val: string) {
        setDestInput(val);
        setDest(null);
        if (destTimer.current) clearTimeout(destTimer.current);
        if (val.trim().length < 2) { setDestSuggestions([]); return; }
        destTimer.current = setTimeout(async () => {
            const results = await fetchAirports(val);
            setDestSuggestions(results);
        }, 400);
    }

    function selectOrigin(airport: AirportOption) {
        setOrigin(airport);
        setOriginInput(`${airport.skyId} · ${airport.name}`);
        setOriginSuggestions([]);
    }

    function selectDest(airport: AirportOption) {
        setDest(airport);
        setDestInput(`${airport.skyId} · ${airport.name}`);
        setDestSuggestions([]);
    }

    function swapAirports() {
        const o = origin, d = dest, oi = originInput, di = destInput;
        setOrigin(d);
        setDest(o);
        setOriginInput(di);
        setDestInput(oi);
        setOriginSuggestions([]);
        setDestSuggestions([]);
    }

    async function handleSearch() {
        if (!origin || !dest || !date) return;
        setLoading(true);
        setError(null);
        setFlights([]);
        setSearched(true);
        try {
            const params = new URLSearchParams({
                origin_sky_id: origin.skyId,
                destination_sky_id: dest.skyId,
                origin_entity_id: origin.entityId,
                destination_entity_id: dest.entityId,
                date,
            });
            const res = await fetch(`http://localhost:8000/flights/search?${params}`);
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            setFlights(data.data?.itineraries ?? []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    const canSearch = !!origin && !!dest && !!date;

    return (
        <div className="min-h-screen py-16 px-4" style={{ backgroundColor: '#f0e4c0' }}>
            <div className="mx-auto w-full max-w-2xl flex flex-col gap-6">
                <div className="flex items-baseline justify-between">
                    <h1 className="text-8xl text-stone-800 tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>side<span style={{ fontWeight: 'bold' }}>quest</span>.</h1>
                    <Link
                        to="/generated/sidequests"
                        className="text-sm text-amber-800 hover:text-stone-800 transition-colors"
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                        → Sidequests
                    </Link>
                </div>

                {/* Search card */}
                <div
                    className="rounded-xl border border-amber-800/30 p-6 shadow-sm flex flex-col gap-5"
                    style={{ backgroundColor: '#fdf5e4' }}
                >
                    <p
                        className="text-stone-500 text-sm"
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                        Find your next flight.
                    </p>

                    {/* Airport row */}
                    <div className="flex gap-3 items-end">
                        <AirportInput
                            label="From"
                            value={originInput}
                            onChange={handleOriginChange}
                            onSelect={selectOrigin}
                            suggestions={originSuggestions}
                            placeholder="City or airport"
                        />

                        <button
                            onClick={swapAirports}
                            className="mb-0.5 shrink-0 rounded-xl border border-amber-800/30 p-3 hover:bg-amber-800/10 transition-colors text-amber-800 text-lg"
                            style={{ backgroundColor: '#f0e4c0' }}
                            title="Swap airports"
                        >
                            ⇄
                        </button>

                        <AirportInput
                            label="To"
                            value={destInput}
                            onChange={handleDestChange}
                            onSelect={selectDest}
                            suggestions={destSuggestions}
                            placeholder="City or airport"
                        />
                    </div>

                    {/* Date row */}
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