/*
{"layover_airport": "MAN", "layover_flight_arrival": "2026-04-30T10:25:00Z", "layover_flight_departure": "2026-04-30T17:40:00Z", "time_to_complete_quests": 4.5, "sidequests": [{"type": "culture", "description": "Visit the John Rylands Research Institute and Library", "time_to_complete": 2, "time_to_travel": 1, "price": 0, "latitude": 53.4777, "longitude": -2.2412}, {"type": "shopping", "description": "Explore the Northern Quarter's independent shops and street art", "time_to_complete": 1.5, "time_to_travel": 0.5, "price": 15, "latitude": 53.4833, "longitude": -2.2333}, {"type": "shopping", "description": "description: Visit the Northern Quarter's independent shops and street art", "time_to_complete": 1, "time_to_travel": 0.5, "price": 15, "latitude": 53.4833, "longitude": -2.2333}] }
*/


import { useState, useEffect } from 'react';
import { onSelection, notifyClear, notifyRoute, notifyReset, notifySidequests, notifyLayoverOrder } from '../lib/airportStore';
import type { SidequestResponse } from '../types/sidequest';

function InputBar() {
    const [departure, setDeparture] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const [routeActive, setRouteActive] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        return onSelection((dep, dest) => {
            setDeparture(dep ? dep.skyId : '');
            setDestination(dest ? dest.skyId : '');
        });
    }, []);

    const getSideQuests = async (params: Record<string, string>) => {
        const url = `http://localhost:8000/api/generate?${new URLSearchParams(params)}`;
        console.log('Fetching sidequests with params:', params);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        console.log('Received sidequests:', data);
        let parsed: SidequestResponse;
        if (typeof data === 'string') {
            const match = data.match(/\{[\s\S]*\}/);
            parsed = JSON.parse(match ? match[0] : data);
        } else {
            parsed = data as SidequestResponse;
        }
        notifySidequests(parsed);
    }

    const handleSearch = async () => {
        if (!departure || !destination || !date) return;

        setLoading(true);
        const [datePart] = date.split('T');
        const [year, month, day] = datePart.split('-').map(Number);

        const params = new URLSearchParams({
            origin: departure,
            destination,
            year: String(year),
            month: String(month),
            day: String(day),
        });

        try {
            const res = await fetch(`http://localhost:8000/flights?${params}`);
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            console.log('Received flight data:', data);

            const first = data.flights?.[0];
            if (first?.outbound) {
                const { from, layovers, to } = first.outbound;
                const layoverCodes: string[] = (layovers ?? []).map((l: { airport: string }) => l.airport);
                notifyRoute([from, ...layoverCodes, to]);
                notifyLayoverOrder(layoverCodes);
                setRouteActive(true);
                console.log('Route found:', [from, ...layoverCodes, to]);
                for (const layover of data.flights[0].outbound.layovers ?? []) {
                    getSideQuests({ prompt: JSON.stringify(layover) });
                }
            }
        } catch (err) {
            console.error('[Flights] Error:', err);
        } finally {
            setLoading(false);
        }

        notifyClear();
        setDeparture('');
        setDestination('');
        setDate('');
    };

    const inputClass = "bg-amber-50/60 border border-amber-800/30 rounded-full text-stone-800 text-sm px-4 py-2 outline-none placeholder-stone-400 focus:border-amber-800/60 focus:bg-amber-50/80 transition-colors min-w-0";

    return (
        <div
            className="fixed top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2.5 rounded-full border border-amber-800/30 shadow-lg"
            style={{ backgroundColor: '#fdf5e4', fontFamily: "'Instrument Serif', serif" }}
        >
            <input
                type="text"
                placeholder="Departure..."
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                className={inputClass}
                style={{ width: '120px' }}
            />
            <input
                type="text"
                placeholder="Destination..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                className={inputClass}
                style={{ width: '120px' }}
            />
            <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                className={inputClass}
                style={{ width: '180px', colorScheme: 'light' }}
            />
            <button
                onClick={handleSearch}
                disabled={loading}
                className="rounded-full text-amber-50 text-sm font-semibold px-5 py-2 cursor-pointer transition-opacity active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                style={{ backgroundColor: '#3d2314' }}
            >
                {loading ? <span className="spinner" /> : 'Search'}
            </button>
            {routeActive && (
                <button
                    onClick={() => { notifyReset(); setRouteActive(false); }}
                    className="rounded-full text-sm font-semibold px-5 py-2 cursor-pointer transition-opacity active:scale-95 whitespace-nowrap border border-amber-800/40 text-amber-900 bg-amber-100/60 hover:bg-amber-100"
                >
                    Reset
                </button>
            )}
        </div>
    );
}

export default InputBar;