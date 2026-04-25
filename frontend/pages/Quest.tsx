import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { FlightResult } from '../types/flights';
import type { SidequestResponse } from '../types/sidequest';
import FlightInfo from '../components/FlightInfo';
import ActivityCard from '../components/ActivityCard';
import Spinner from '../components/Spinner';
import { fmtDuration, fmtTime } from '../lib/format';

const API_URL = 'http://localhost:8000';

function buildPrompt(flight: FlightResult): string {
    const layover = flight.outbound.primaryLayover!;
    return [
        `Layover city: ${layover.city}`,
        `Layover airport: ${layover.airport} (${layover.airportName})`,
        `Total layover time: ${layover.waitMinutes} minutes (${fmtDuration(layover.waitMinutes)})`,
        `Arrival at layover airport: ${layover.arriveAt}`,
        `Departure from layover airport: ${layover.departAt}`,
        `Final destination: ${flight.outbound.to} (${flight.outbound.toName})`,
    ].join('\n');
}

export default function Quest() {
    const location = useLocation();
    const navigate = useNavigate();
    const flight = (location.state as { flight?: FlightResult } | null)?.flight;

    const [result, setResult] = useState<SidequestResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!flight || !flight.outbound.primaryLayover) {
            setError('No flight data — go back and pick a flight with a layover.');
            setLoading(false);
            return;
        }
        const prompt = buildPrompt(flight);
        (async () => {
            try {
                const res = await fetch(`${API_URL}/api/generate?prompt=${encodeURIComponent(prompt)}`);
                if (!res.ok) throw new Error(`Server error: ${res.status}`);
                const data = await res.json();
                const parsed: SidequestResponse = typeof data === 'string' ? JSON.parse(data) : data;
                setResult(parsed);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Something went wrong');
            } finally {
                setLoading(false);
            }
        })();
    }, [flight]);

    const layover = flight?.outbound.primaryLayover ?? null;

    return (
        <div className="min-h-screen py-16 px-4" style={{ backgroundColor: '#f0e4c0' }}>
            <div className="mx-auto w-full max-w-xl flex flex-col gap-6">
                <div className="flex items-baseline justify-between">
                    <h1 className="text-8xl text-stone-800 tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
                        Sidequest.
                    </h1>
                    <Link
                        to="/flights"
                        className="text-sm text-amber-800 hover:text-stone-800 transition-colors"
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                        ← Back to flights
                    </Link>
                </div>

                {layover && (
                    <div
                        className="rounded-xl border border-amber-800/30 p-5"
                        style={{ backgroundColor: '#fdf5e4' }}
                    >
                        <p className="text-xs text-stone-500 uppercase tracking-widest mb-1" style={{ fontFamily: "'Instrument Serif', serif" }}>
                            Layover in
                        </p>
                        <p className="text-3xl text-stone-800" style={{ fontFamily: "'Instrument Serif', serif" }}>
                            {layover.city} <span className="text-amber-800/70 text-xl">· {layover.airport}</span>
                        </p>
                        <p className="text-sm text-stone-500 mt-2">
                            Land {fmtTime(layover.arriveAt)} → Take off {fmtTime(layover.departAt)}
                            <span className="text-amber-800 ml-2">({fmtDuration(layover.waitMinutes)})</span>
                        </p>
                    </div>
                )}

                {loading && (
                    <div className="flex flex-col items-center gap-3 text-stone-500 py-12" style={{ fontFamily: "'Instrument Serif', serif" }}>
                        <Spinner size={32} className="text-amber-800" />
                        <p className="text-base">Crafting your sidequest{layover ? ` in ${layover.city}` : ''}...</p>
                        <p className="text-xs text-stone-400">Gemma is planning your itinerary, this can take up to 30 seconds</p>
                    </div>
                )}

                {error && (
                    <div className="rounded-xl border border-red-900/30 p-5 text-red-900 text-sm" style={{ backgroundColor: '#fdf5e4', fontFamily: "'Instrument Serif', serif" }}>
                        {error}
                        <button
                            onClick={() => navigate('/flights')}
                            className="block mt-3 text-amber-800 hover:underline"
                        >
                            ← Back to flights
                        </button>
                    </div>
                )}

                {result && (
                    <>
                        <FlightInfo data={result} />
                        <div className="flex flex-col gap-3">
                            {result.sidequests.map((activity, i) => (
                                <ActivityCard key={i} activity={activity} index={i} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
