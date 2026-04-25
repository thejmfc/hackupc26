import { useState, useEffect } from 'react';
import { onSelection, notifyClear, notifyRoute, notifyReset } from '../lib/airportStore';

function InputBar() {
    const [departure, setDeparture] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const [routeActive, setRouteActive] = useState(false);

    useEffect(() => {
        return onSelection((dep, dest) => {
            setDeparture(dep ? dep.skyId : '');
            setDestination(dest ? dest.skyId : '');
        });
    }, []);

    const handleSearch = async () => {
        if (!departure || !destination || !date) return;

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

            const first = data.flights?.[0];
            if (first?.outbound) {
                const { from, layovers, to } = first.outbound;
                const layoverCodes: string[] = (layovers ?? []).map((l: { airport: string }) => l.airport);
                notifyRoute([from, ...layoverCodes, to]);
                setRouteActive(true);
                console.log('Route found:', [from, ...layoverCodes, to]);
            }
        } catch (err) {
            console.error('[Flights] Error:', err);
        }

        notifyClear();
        setDeparture('');
        setDestination('');
        setDate('');
    };

    return (
        <div className="input-bar">
            <input
                type="text"
                placeholder="Departure..."
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
            <input
                type="text"
                placeholder="Destination..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
            <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
            <button onClick={handleSearch}>Search</button>
            {routeActive && (
                <button onClick={() => { notifyReset(); setRouteActive(false); }}>Reset</button>
            )}
        </div>
    );
}

export default InputBar;