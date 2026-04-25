import type { FlightResult } from '../types/flights';

interface Props {
    flight: FlightResult;
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function FlightResultCard({ flight }: Props) {
    const leg = flight.legs[0];
    if (!leg) return null;

    const carrier = leg.carriers.marketing[0];
    const stops = leg.stopCount === 0 ? 'Direct' : `${leg.stopCount} stop${leg.stopCount > 1 ? 's' : ''}`;

    return (
        <div
            className="rounded-xl border border-amber-800/30 p-5 shadow-sm flex items-center justify-between gap-4"
            style={{ backgroundColor: '#fdf5e4' }}
        >
            <div className="flex items-center gap-3 min-w-0">
                {carrier?.logoUrl && (
                    <img src={carrier.logoUrl} alt={carrier.name} className="w-8 h-8 rounded object-contain shrink-0" />
                )}
                <div className="min-w-0">
                    <p
                        className="text-xs text-stone-400 truncate"
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                        {carrier?.name ?? 'Unknown airline'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span
                            className="text-lg font-semibold text-stone-800"
                            style={{ fontFamily: "'Instrument Serif', serif" }}
                        >
                            {formatTime(leg.departure)}
                        </span>
                        <span className="text-stone-400 text-sm">→</span>
                        <span
                            className="text-lg font-semibold text-stone-800"
                            style={{ fontFamily: "'Instrument Serif', serif" }}
                        >
                            {formatTime(leg.arrival)}
                        </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                        {leg.origin.displayCode} → {leg.destination.displayCode} · {formatDuration(leg.durationInMinutes)} · {stops}
                    </p>
                </div>
            </div>

            <div className="text-right shrink-0">
                <p
                    className="text-xl font-bold text-stone-800"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                    {flight.price.formatted}
                </p>
            </div>
        </div>
    );
}
