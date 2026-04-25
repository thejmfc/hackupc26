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

    const handleSearch = () => {
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