import type { Airport } from '../components/Airport';
import type { SidequestResponse } from '../types/sidequest';

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

type RouteListener = (iatas: string[]) => void;
const routeListeners = new Set<RouteListener>();

/** Called by InputBar with ordered IATA codes [from, ...layovers, to] after a flight search. */
export function notifyRoute(iatas: string[]) {
    routeListeners.forEach(l => l(iatas));
}

export function onRoute(listener: RouteListener): () => void {
    routeListeners.add(listener);
    return () => routeListeners.delete(listener);
}

type ResetListener = () => void;
const resetListeners = new Set<ResetListener>();

/** Called by InputBar reset button to clear the route and restore the globe. */
export function notifyReset() {
    resetListeners.forEach(l => l());
}

export function onReset(listener: ResetListener): () => void {
    resetListeners.add(listener);
    return () => resetListeners.delete(listener);
}

type SidequestListener = (data: SidequestResponse) => void;
const sidequestListeners = new Set<SidequestListener>();

/** Called by InputBar when sidequest data arrives for a layover. */
export function notifySidequests(data: SidequestResponse) {
    sidequestListeners.forEach(l => l(data));
}

export function onSidequests(listener: SidequestListener): () => void {
    sidequestListeners.add(listener);
    return () => sidequestListeners.delete(listener);
}

type LayoverOrderListener = (iatas: string[]) => void;
const layoverOrderListeners = new Set<LayoverOrderListener>();

/** Called by InputBar with the ordered layover IATA codes *before* sidequest fetches begin. */
export function notifyLayoverOrder(iatas: string[]) {
    layoverOrderListeners.forEach(l => l(iatas));
}

export function onLayoverOrder(listener: LayoverOrderListener): () => void {
    layoverOrderListeners.add(listener);
    return () => layoverOrderListeners.delete(listener);
}
