import mapboxgl from 'mapbox-gl';

export interface Airport {
    skyId: string;
    entityId: string;
    name: string;
    coords: [number, number];
}

async function geocodeAirport(iata: string): Promise<[number, number] | null> {
    const token = import.meta.env.VITE_MAPBOX_API_TOKEN;
    const query = encodeURIComponent(`${iata} airport`);
    const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?types=poi&access_token=${token}&limit=1`
    );
    const data = await res.json();
    return data.features?.[0]?.center ?? null;
}

const SKYSCANNER_HOST = 'sky-scrapper.p.rapidapi.com';

export async function fetchAirports(countryName: string): Promise<Airport[]> {
    const res = await fetch(
        `https://${SKYSCANNER_HOST}/api/v1/flights/searchAirport?query=${encodeURIComponent(countryName)}&locale=en-US`,
        {
            headers: {
                'x-rapidapi-key': import.meta.env.VITE_SKYSCANNER_API_KEY,
                'x-rapidapi-host': SKYSCANNER_HOST,
            },
        }
    );
    const data = await res.json();

    const entities = (data.data ?? []).filter(
        (e: any) => e.navigation?.entityType === 'AIRPORT'
    );

    const airports = await Promise.all(
        entities.map(async (e: any) => {
            const coords = await geocodeAirport(e.skyId);
            if (!coords) return null;
            return {
                skyId: e.skyId,
                entityId: e.entityId,
                name: e.presentation?.title ?? e.skyId,
                coords,
            } as Airport;
        })
    );

    return airports.filter(Boolean) as Airport[];
}

function createPlaneEl(color: string): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = 'cursor:pointer; line-height:1; user-select:none;';
    el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="${color}">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
    </svg>`;
    return el;
}

export function addAirportMarkers(
    map: mapboxgl.Map,
    airports: Airport[],
    onSelect: (airport: Airport) => void,
    departureId?: string,
    destinationId?: string,
): mapboxgl.Marker[] {
    return airports.map((airport) => {
        const color = airport.skyId === departureId
            ? '#22c55e'
            : airport.skyId === destinationId
            ? '#3b82f6'
            : '#9ca3af';

        const el = createPlaneEl(color);
        const marker = new mapboxgl.Marker({ element: el })
            .setLngLat(airport.coords)
            .setPopup(new mapboxgl.Popup({ offset: 12 }).setText(airport.name))
            .addTo(map);

        el.addEventListener('click', (e) => {
            e.stopPropagation();
            onSelect(airport);
        });

        return marker;
    });
}
