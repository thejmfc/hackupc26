import { useState } from 'react';
import { Link } from 'react-router-dom';
import FlightInfo from '../components/FlightInfo';
import ActivityCard from '../components/ActivityCard';
import type { SidequestResponse } from '../types/sidequest';

export default function GeneratedSidequests() {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<SidequestResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit() {
        console.log('Submitting prompt:', prompt);

        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch(`http://localhost:8000/api/generate?prompt=${encodeURIComponent(prompt)}`);
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            const parsed: SidequestResponse = typeof data === 'string' ? JSON.parse(data) : data;
            setResult(parsed);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen py-16 px-4" style={{ backgroundColor: '#f0e4c0' }}>
            <div className="mx-auto w-full max-w-xl flex flex-col gap-6">
                <div className="flex items-baseline justify-between">
                    <h1 className="text-8xl text-stone-800 tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>Sidequest.</h1>
                    <Link
                        to="/flights"
                        className="text-sm text-amber-800 hover:text-stone-800 transition-colors"
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                        → Flights
                    </Link>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder="Describe your layover..."
                        className="flex-1 rounded-xl border border-amber-800/40 px-6 py-4 text-stone-800 placeholder-stone-400 outline-none focus:border-amber-900 focus:ring-2 focus:ring-amber-900/20 transition-colors"
                        style={{ backgroundColor: '#fdf5e4', fontFamily: "'Instrument Serif', serif" }}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="rounded-xl px-6 py-4 text-amber-50 font-medium hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        style={{ backgroundColor: '#3d2314', fontFamily: "'Instrument Serif', serif" }}
                    >
                        {loading ? '...' : 'Go'}
                    </button>
                </div>

                {error && <p className="text-red-900 text-sm">{error}</p>}

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
