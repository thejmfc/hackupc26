type InputBarProps = {
    departure: string;
    onDepartureChange: (value: string) => void;
    destination: string;
    onDestinationChange: (value: string) => void;
    date: string;
    onDateChange: (value: string) => void;
    onSearch: (departure: string, destination: string, date: string) => void;
};

function InputBar({ departure, onDepartureChange, destination, onDestinationChange, date, onDateChange, onSearch }: InputBarProps) {
    const handleSearch = () => {
        onSearch(departure, destination, date);
        onDepartureChange('');
        onDestinationChange('');
        onDateChange('');
    };

    return (
        <div className="input-bar">
            <input
                type="text"
                placeholder="Departure City..."
                value={departure}
                onChange={(e) => onDepartureChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
            <input
                type="text"
                placeholder="Destination City..."
                value={destination}
                onChange={(e) => onDestinationChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
            <input
                type="datetime-local"
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
            <button onClick={handleSearch}>Search</button>
        </div>
    );
}

export default InputBar;