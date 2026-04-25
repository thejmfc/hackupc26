import type { Activity } from '../types/sidequest';

const TYPE_COLORS: Record<string, string> = {
    food: 'bg-orange-900/15 text-orange-900',
    culture: 'bg-indigo-900/15 text-indigo-900',
    nature: 'bg-green-900/15 text-green-900',
    shopping: 'bg-rose-900/15 text-rose-900',
};

interface Props {
    activity: Activity;
    index: number;
}

export default function ActivityCard({ activity, index }: Props) {
    const { type, description, time_to_complete, time_to_travel, price } = activity;
    const colorClass = TYPE_COLORS[type.toLowerCase()] ?? 'bg-stone-800/10 text-stone-700';

    return (
        <div className="rounded-xl border border-amber-800/30 p-5 flex gap-4 shadow-sm" style={{ backgroundColor: '#fdf5e4' }}>
            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-amber-50 text-sm font-bold" style={{ backgroundColor: '#3d2314', fontFamily: "'Instrument Serif', serif" }}>
                {index + 1}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${colorClass}`}>
                        {type}
                    </span>
                    <span className="text-xs text-stone-500">£{price.toFixed(0)}</span>
                </div>

                <p className="text-stone-700 text-sm leading-relaxed" style={{ fontFamily: "'Instrument Serif', serif" }}>{description}</p>

                <div className="flex gap-4 mt-3 text-xs text-stone-400 tracking-wide">
                    <span>{time_to_complete}h to complete</span>
                    {time_to_travel !== undefined && <span>{time_to_travel}h to travel</span>}
                </div>
            </div>
        </div>
    );
}