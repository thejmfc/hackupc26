import type { SidequestResponse } from '../types/sidequest';

interface Props {
    data: Pick<SidequestResponse, 'layover_airport' | 'layover_flight_arrival' | 'layover_flight_departure' | 'time_to_complete_quests'>;
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function FlightInfo({ data }: Props) {
    const { layover_airport, layover_flight_arrival, layover_flight_departure, time_to_complete_quests } = data;

    const layoverMs = new Date(layover_flight_departure).getTime() - new Date(layover_flight_arrival).getTime();
    const layoverHours = (layoverMs / 3_600_000).toFixed(1);

    return (
        <div className="rounded-xl border border-amber-800/30 p-6 shadow-sm" style={{ backgroundColor: '#fdf5e4' }}>
            <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-stone-800" style={{ fontFamily: "'Instrument Serif', serif" }}>{layover_airport}</div>
                <div className="text-sm text-stone-500 tracking-wide">{formatDate(layover_flight_arrival)}</div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-center">
                    <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Arrival</p>
                    <p className="text-xl font-semibold text-stone-800" style={{ fontFamily: "'Instrument Serif', serif" }}>{formatTime(layover_flight_arrival)}</p>
                </div>

                <div className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-xs text-amber-800">{layoverHours}h layover</p>
                    <div className="w-full flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-800" />
                        <div className="flex-1 border-t border-dashed border-amber-800/50" />
                        <div className="w-2 h-2 rounded-full bg-amber-800" />
                    </div>
                    <p className="text-xs text-stone-500">{time_to_complete_quests}h of quests</p>
                </div>

                <div className="text-center">
                    <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Departure</p>
                    <p className="text-xl font-semibold text-stone-800" style={{ fontFamily: "'Instrument Serif', serif" }}>{formatTime(layover_flight_departure)}</p>
                </div>
            </div>
        </div>
    );
}