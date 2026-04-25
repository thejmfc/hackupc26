import { Link } from 'react-router-dom';

const features = [
    {
        icon: '✈',
        title: 'Layover Planning',
        body: 'Tell us your layover details and we\'ll figure out exactly how much time you have to explore.',
    },
    {
        icon: '🗺',
        title: 'AI Sidequests',
        body: 'Our AI suggests a curated set of activities — food, culture, nature, shopping — that fit your time and budget.',
    },
    {
        icon: '⏱',
        title: 'Time-Aware',
        body: 'Every suggestion accounts for travel time and a 2-hour buffer so you never miss your connecting flight.',
    },
];

export default function Landing() {
    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f0e4c0' }}>
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 gap-12">

                <div className="text-center flex flex-col gap-4 max-w-xl">
                    <h1
                        className="text-9xl text-stone-800 tracking-tight leading-none"
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                        side<span style={{ fontWeight: 'bold' }}>quest</span>.
                    </h1>
                    <p
                        className="text-xl text-stone-600 leading-relaxed"
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                        Turn your layover into an adventure. Discover what's worth seeing, eating, and doing — right outside the airport.
                    </p>
                    <div className="flex gap-3 justify-center mt-2">
                        <Link
                            to="/flights"
                            className="px-8 py-3 rounded-xl text-amber-50 font-medium transition-colors hover:opacity-90"
                            style={{ backgroundColor: '#3d2314', fontFamily: "'Instrument Serif', serif" }}
                        >
                            Start exploring →
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
                    {features.map(({ icon, title, body }) => (
                        <div
                            key={title}
                            className="rounded-xl border border-amber-800/30 p-6 flex flex-col gap-3 shadow-sm"
                            style={{ backgroundColor: '#fdf5e4' }}
                        >
                            <span className="text-3xl">{icon}</span>
                            <h2
                                className="text-lg font-bold text-stone-800"
                                style={{ fontFamily: "'Instrument Serif', serif" }}
                            >
                                {title}
                            </h2>
                            <p
                                className="text-sm text-stone-500 leading-relaxed"
                                style={{ fontFamily: "'Instrument Serif', serif" }}
                            >
                                {body}
                            </p>
                        </div>
                    ))}
                </div>

            </div>

            <footer
                className="text-center py-6 text-xs text-stone-400"
                style={{ fontFamily: "'Instrument Serif', serif" }}
            >
                Built at HackUPC 2026
            </footer>
        </div>
    );
}
