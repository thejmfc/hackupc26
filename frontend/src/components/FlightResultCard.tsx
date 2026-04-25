import type { FlightResult } from '../types/flights';

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(mins: number) {
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

interface Props {
    flight: FlightResult;
}

export default function FlightResultCard({ flight }: Props) {
    const leg = flight.outbound;
    const stopsLabel = leg.stops === 0 ? 'Direct' : `${leg.stops} stop${leg.stops > 1 ? 's' : ''}`;
    const dayDelta = Math.floor(
        (new Date(leg.arrive).getTime() - new Date(leg.depart).getTime()) / 86_400_000
    );

    return (
        <div className="rounded-xl border border-amber-800/30 p-5 shadow-sm" style={{ backgroundColor: '#fdf5e4' }}>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 w-36 flex-shrink-0">
                    {leg.carrierLogo && (
                        <img
                            src={leg.carrierLogo}
                            alt={leg.carrier}
                            className="w-8 h-8 object-contain rounded"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    )}
                    <div>
                        <p className="text-sm text-stone-800 leading-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
                            {leg.carrier}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">{stopsLabel}</p>
                    </div>
                </div>

                <div className="flex-1 flex items-center gap-3">
                    <div className="text-center">
                        <p className="text-xl font-semibold text-stone-800" style={{ fontFamily: "'Instrument Serif', serif" }}>
                            {fmtTime(leg.depart)}
                        </p>
                        <p className="text-xs text-stone-400 tracking-wide mt-0.5">{leg.from}</p>
                    </div>

                    <div className="flex-1 flex flex-col items-center gap-1">
                        <p className="text-xs text-amber-800">{fmtDuration(leg.durationMin)}</p>
                        <div className="w-full flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-amber-800 flex-shrink-0" />
                            <div className="flex-1 border-t border-dashed border-amber-800/50" />
                            <div className="w-2 h-2 rounded-full bg-amber-800 flex-shrink-0" />
                        </div>
                        {leg.primaryLayover && (
                            <p className="text-xs text-amber-800/70">
                                via {leg.primaryLayover.city} ({fmtDuration(leg.primaryLayover.waitMinutes)})
                            </p>
                        )}
                    </div>

                    <div className="text-center">
                        <p className="text-xl font-semibold text-stone-800" style={{ fontFamily: "'Instrument Serif', serif" }}>
                            {fmtTime(leg.arrive)}
                            {dayDelta > 0 && (
                                <span className="text-xs text-amber-800 ml-1">+{dayDelta}</span>
                            )}
                        </p>
                        <p className="text-xs text-stone-400 tracking-wide mt-0.5">{leg.to}</p>
                    </div>
                </div>

                <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-stone-800" style={{ fontFamily: "'Instrument Serif', serif" }}>
                        £{flight.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">per person</p>
                </div>
            </div>
        </div>
    );
}
