import type { Airport } from '../components/Airport';

type SelectionListener = (departure: Airport | null, destination: Airport | null) => void;
type ClearListener = () => void;

const selectionListeners = new Set<SelectionListener>();
const clearListeners = new Set<ClearListener>();

/** Called by Globe when the user selects/deselects airport pins. */
export function notifySelection(departure: Airport | null, destination: Airport | null) {
    selectionListeners.forEach(l => l(departure, destination));
}

/** Called by InputBar when a search is submitted, so Globe can reset its visual state. */
export function notifyClear() {
    clearListeners.forEach(l => l());
}

export function onSelection(listener: SelectionListener): () => void {
    selectionListeners.add(listener);
    return () => selectionListeners.delete(listener);
}

export function onClear(listener: ClearListener): () => void {
    clearListeners.add(listener);
    return () => clearListeners.delete(listener);
}
