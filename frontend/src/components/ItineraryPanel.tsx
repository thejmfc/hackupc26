import { useState, useEffect } from 'react';
import { onSidequests, onReset, onLayoverOrder } from '../lib/airportStore';
import { fetchAirportByIata } from './Airport';
import type { SidequestResponse, Activity } from '../types/sidequest';

interface ItineraryLeg {
    durationMin: number;
}

interface ItineraryStop {
    kind: 'arrive' | 'activity' | 'depart';
    time: Date;
    label: string;
    activityType?: string;
    durationMin?: number;
    price?: number;
    /** Travel time to the *next* stop */
    legToNext?: ItineraryLeg;
}

const ACTIVITY_ICON: Record<string, string> = {
    culture: '🏛',
    shopping: '🛍',
    food: '🍽',
    restaurant: '🍽',
    nature: '🌿',
    sport: '⚽',
    lounge: '✈',
};

const ACTIVITY_COLOUR: Record<string, string> = {
    culture: '#7c3aed',
    shopping: '#db2777',
    food: '#ea580c',
    restaurant: '#ea580c',
    nature: '#16a34a',
    sport: '#0284c7',
};

function colourFor(type = '') {
    return ACTIVITY_COLOUR[type.toLowerCase()] ?? '#d97706';
}

function fmt(d: Date) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Call Google Routes API v2 for a single leg, returning duration in minutes. */
async function fetchLegDuration(
    from: [number, number],
    to: [number, number],
    apiKey: string,
): Promise<number> {
    const body = {
        origin: { location: { latLng: { latitude: from[1], longitude: from[0] } } },
        destination: { location: { latLng: { latitude: to[1], longitude: to[0] } } },
        travelMode: 'TRANSIT',
    };
    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.duration',
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Routes API ${res.status}`);
    const json = await res.json();
    // duration is returned as e.g. "1234s"
    const raw: string = json.routes?.[0]?.duration ?? '1800s';
    return Math.round(parseInt(raw) / 60);
}

async function buildItinerary(data: SidequestResponse): Promise<ItineraryStop[]> {
    const airport = await fetchAirportByIata(data.layover_airport);
    const airportLabel = airport?.name ?? data.layover_airport;
    const arrival = new Date(data.layover_flight_arrival);
    const departure = new Date(data.layover_flight_departure);
    const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? '';

    const stops: ItineraryStop[] = [];
    stops.push({ kind: 'arrive', time: arrival, label: airportLabel });

    if (!data.sidequests || data.sidequests.length === 0) {
        stops.push({
            kind: 'activity',
            time: arrival,
            label: 'Layover is too short to leave the airport — sit back with runway views and wait to board your flight.',
            activityType: 'lounge',
        });
        stops.push({ kind: 'depart', time: departure, label: airportLabel });
        return stops;
    }

    // Build waypoints: airport → activities → airport
    const airportCoords: [number, number] = airport?.coords ?? [0, 0];
    const waypoints: [number, number][] = [
        airportCoords,
        ...data.sidequests.map((a): [number, number] => [a.longitude, a.latitude]),
        airportCoords,
    ];

    // Pre-fetch all transit legs in parallel (fall back to time_to_travel on error)
    const legDurations = await Promise.all(
        waypoints.slice(0, -1).map(async (from, i) => {
            const to = waypoints[i + 1];
            if (apiKey) {
                try {
                    return await fetchLegDuration(from, to, apiKey);
                } catch {
                    // fall through to estimate
                }
            }
            // Fallback: use time_to_travel from activity (or 30 min for return)
            const activity = data.sidequests[i] as Activity | undefined;
            return Math.round((activity?.time_to_travel ?? 0.5) * 60);
        }),
    );

    // Build timeline starting 30 min after landing (time to exit terminal)
    let cursor = new Date(arrival.getTime() + 30 * 60_000);

    data.sidequests.forEach((activity: Activity, i: number) => {
        const travelMin = legDurations[i];
        // Annotate the previous stop with the leg to this activity
        stops[stops.length - 1].legToNext = { durationMin: travelMin };

        cursor = new Date(cursor.getTime() + travelMin * 60_000);
        stops.push({
            kind: 'activity',
            time: new Date(cursor),
            label: activity.description
                .replace(/^description:\s*/i, '')
                .replace(/\/\/[^\n]*/g, '')
                .replace(/\bres\b/gi, '')
                .replace(/\s{2,}/g, ' ')
                .trim(),
            activityType: activity.type,
            durationMin: Math.round(activity.time_to_complete * 60),
            price: activity.price,
        });
        cursor = new Date(cursor.getTime() + activity.time_to_complete * 3_600_000);
    });

    // Return leg to airport
    const returnMin = legDurations[data.sidequests.length];
    stops[stops.length - 1].legToNext = { durationMin: returnMin };
    stops.push({ kind: 'depart', time: departure, label: airportLabel });

    return stops;
}

interface ItineraryEntry {
    iata: string;
    cityLabel: string;
    stops: ItineraryStop[];
}

export default function ItineraryPanel() {
    const [open, setOpen] = useState(false);
    const [itineraries, setItineraries] = useState<ItineraryEntry[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);

    useEffect(() => {
        const unsubReset = onReset(() => {
            setItineraries([]);
            setActiveIdx(0);
            setOpen(false);
        });

        // Pre-seed ordered empty slots so responses arriving out of order fill the right position
        const unsubOrder = onLayoverOrder((iatas: string[]) => {
            setItineraries(iatas.map(iata => ({ iata, cityLabel: iata, stops: [] })));
            setActiveIdx(0);
        });

        const unsubSidequests = onSidequests(async (data: SidequestResponse) => {
            const built = await buildItinerary(data);
            const airport = await fetchAirportByIata(data.layover_airport);
            const cityLabel = airport?.name ?? data.layover_airport;
            const entry: ItineraryEntry = { iata: data.layover_airport, cityLabel, stops: built };
            setItineraries(prev => {
                const idx = prev.findIndex(e => e.iata === data.layover_airport);
                if (idx >= 0) {
                    const next = [...prev];
                    next[idx] = entry;
                    return next;
                }
                // Fallback: append if not pre-seeded (e.g. order event missed)
                return [...prev, entry];
            });
            setOpen(true);
        });

        return () => {
            unsubReset();
            unsubOrder();
            unsubSidequests();
        };
    }, []);

    if (itineraries.length === 0) return null;

    const current = itineraries[activeIdx] ?? itineraries[0];
    const stops = current.stops;
    const total = itineraries.length;

    return (
        <>
            {/* Hamburger toggle button */}
            <button
                onClick={() => setOpen(o => !o)}
                title="View itinerary"
                className="fixed bottom-6 right-6 z-20 w-11 h-11 flex flex-col gap-1.5 items-center justify-center rounded-full shadow-lg border border-amber-800/30 cursor-pointer transition-colors hover:bg-amber-100"
                style={{ backgroundColor: '#fdf5e4' }}
            >
                <span className="block w-5 h-0.5 rounded bg-stone-700" />
                <span className="block w-5 h-0.5 rounded bg-stone-700" />
                <span className="block w-5 h-0.5 rounded bg-stone-700" />
            </button>

            {/* Slide-out drawer */}
            <div
                className={`fixed top-0 right-0 h-full z-20 flex flex-col shadow-2xl border-l border-amber-800/20 transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ width: '340px', backgroundColor: '#fdf5e4', fontFamily: "'Instrument Serif', serif" }}
            >
                {/* Header */}
                <div
                    className="flex flex-col border-b border-amber-800/20 sticky top-0"
                    style={{ backgroundColor: '#fdf5e4' }}
                >
                    <div className="flex items-center justify-between px-5 pt-4 pb-2">
                        <h2 className="text-2xl text-stone-800 tracking-tight">Itinerary</h2>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-stone-400 hover:text-stone-700 transition-colors text-lg leading-none"
                        >
                            ✕
                        </button>
                    </div>

                    {/* City navigator */}
                    <div className="flex items-center justify-between px-3 pb-3 gap-2">
                        <button
                            onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
                            disabled={activeIdx === 0}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-stone-600 disabled:opacity-30 hover:bg-amber-100 transition-colors text-sm"
                        >
                            ‹
                        </button>
                        <div className="flex-1 text-center">
                            <div className="text-sm font-semibold text-stone-800 truncate">{current.cityLabel}</div>
                            <div className="text-xs text-stone-400">{current.iata} &middot; {activeIdx + 1} / {total}</div>
                        </div>
                        <button
                            onClick={() => setActiveIdx(i => Math.min(total - 1, i + 1))}
                            disabled={activeIdx === total - 1}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-stone-600 disabled:opacity-30 hover:bg-amber-100 transition-colors text-sm"
                        >
                            ›
                        </button>
                    </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {stops.map((stop, i) => (
                        <div key={i} className="flex gap-3">
                            {/* Spine */}
                            <div className="flex flex-col items-center flex-shrink-0" style={{ width: 16 }}>
                                {/* Dot */}
                                <div
                                    className="w-3.5 h-3.5 rounded-full mt-0.5 flex-shrink-0 border-2 border-white shadow-sm"
                                    style={{
                                        backgroundColor:
                                            stop.kind !== 'activity'
                                                ? '#f59e0b'
                                                : colourFor(stop.activityType),
                                    }}
                                />
                                {/* Connector */}
                                {i < stops.length - 1 && (
                                    <div
                                        className="flex-1 my-1"
                                        style={{
                                            width: 2,
                                            minHeight: 28,
                                            backgroundColor: stop.legToNext ? '#3b82f6' : '#e5d9bf',
                                            borderRadius: 1,
                                        }}
                                    />
                                )}
                            </div>

                            {/* Content */}
                            <div className="pb-4 flex-1 min-w-0">
                                <div className="text-xs font-semibold text-amber-700 tracking-wide">
                                    {fmt(stop.time)}
                                </div>

                                {stop.kind !== 'activity' ? (
                                    <div className="text-sm font-semibold text-stone-800 mt-0.5">
                                        ✈ {stop.kind === 'arrive' ? 'Arrive at' : 'Depart from'} {stop.label}
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-sm font-semibold text-stone-800 mt-0.5 capitalize">
                                            {ACTIVITY_ICON[stop.activityType ?? ''] ?? '📍'}{' '}
                                            {stop.activityType}
                                        </div>
                                        <div className="text-sm text-stone-600 leading-snug">
                                            {stop.label}
                                        </div>
                                        {(stop.durationMin !== undefined || stop.price !== undefined) && (
                                            <div className="text-xs text-stone-400 mt-1">
                                                {stop.durationMin !== undefined && `⏱ ${stop.durationMin} min`}
                                                {stop.durationMin !== undefined && stop.price !== undefined && ' · '}
                                                {stop.price !== undefined && (stop.price === 0 ? 'Free' : `€${stop.price}`)}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Travel segment to next stop */}
                                {stop.legToNext && (
                                    <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                                        🚇 {stop.legToNext.durationMin} min by transit
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
