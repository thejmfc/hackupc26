export function fmtDuration(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

export function fmtTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}
