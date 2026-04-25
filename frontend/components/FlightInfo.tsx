import type { SidequestResponse } from '../types/sidequest';
import { fmtTime, fmtDate, fmtDuration } from '../lib/format';

interface Props {
    data: Pick<SidequestResponse, 'layover_airport' | 'layover_flight_arrival' | 'layover_flight_departure' | 'time_to_complete_quests'>;
}

export default function FlightInfo({ data }: Props) {
    const { layover_airport, layover_flight_arrival, layover_flight_departure, time_to_complete_quests } = data;

    const layoverMinutes = Math.round(
        (new Date(layover_flight_departure).getTime() - new Date(layover_flight_arrival).getTime()) / 60_000
    );
    const questMinutes = Math.round(time_to_complete_quests * 60);

    return (
        <div className="rounded-xl border border-amber-800/30 p-6 shadow-sm" style={{ backgroundColor: '#fdf5e4' }}>
            <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-stone-800" style={{ fontFamily: "'Instrument Serif', serif" }}>{layover_airport}</div>
                <div className="text-sm text-stone-500 tracking-wide">{fmtDate(layover_flight_arrival)}</div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-center">
                    <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Arrival</p>
                    <p className="text-xl font-semibold text-stone-800" style={{ fontFamily: "'Instrument Serif', serif" }}>{fmtTime(layover_flight_arrival)}</p>
                </div>

                <div className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-xs text-amber-800">{fmtDuration(layoverMinutes)} layover</p>
                    <div className="w-full flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-800" />
                        <div className="flex-1 border-t border-dashed border-amber-800/50" />
                        <div className="w-2 h-2 rounded-full bg-amber-800" />
                    </div>
                    <p className="text-xs text-stone-500">{fmtDuration(questMinutes)} of quests</p>
                </div>

                <div className="text-center">
                    <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Departure</p>
                    <p className="text-xl font-semibold text-stone-800" style={{ fontFamily: "'Instrument Serif', serif" }}>{fmtTime(layover_flight_departure)}</p>
                </div>
            </div>
        </div>
    );
}
