import { useState, useEffect } from 'react';
import { onSelection, notifyClear } from '../lib/airportStore';

function InputBar() {
    const [departure, setDeparture] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');

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
            console.log('[Flights]', data);
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
        </div>
    );
}

export default InputBar;