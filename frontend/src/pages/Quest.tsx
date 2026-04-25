import { Link } from 'react-router-dom';

export default function Quest() {
    return (
        <div className="min-h-screen py-16 px-4" style={{ backgroundColor: '#f0e4c0' }}>
            <div className="mx-auto w-full max-w-xl flex flex-col gap-6">
                <div className="flex items-baseline justify-between">
                    <h1 className="text-8xl text-stone-800 tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>Quest.</h1>
                    <Link
                        to="/"
                        className="text-sm text-amber-800 hover:text-stone-800 transition-colors"
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                        ← Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
