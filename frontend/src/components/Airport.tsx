import mapboxgl from 'mapbox-gl';

const AIRPORTS_CSV_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';

export interface Airport {
    skyId: string;   // IATA code
    entityId: string;
    name: string;
    coords: [number, number];
}

let cachedCsv: string | null = null;

async function getAirportsCsv(): Promise<string> {
    if (!cachedCsv) {
        const res = await fetch(AIRPORTS_CSV_URL);
        cachedCsv = await res.text();
    }
    return cachedCsv;
}

function parseCsvRow(row: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of row) {
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            fields.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    fields.push(current);
    return fields;
}

export async function fetchAirports(isoCode: string): Promise<Airport[]> {
    const csv = await getAirportsCsv();
    const lines = csv.split('\n');
    const header = parseCsvRow(lines[0]);
    const idx = {
        ident:      header.indexOf('ident'),
        type:       header.indexOf('type'),
        name:       header.indexOf('name'),
        lat:        header.indexOf('latitude_deg'),
        lng:        header.indexOf('longitude_deg'),
        isoCountry: header.indexOf('iso_country'),
        iata:       header.indexOf('iata_code'),
    };

    const airports: Airport[] = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = parseCsvRow(lines[i]);
        if (row[idx.isoCountry] !== isoCode) continue;
        if (row[idx.type] !== 'large_airport' || row[idx.iata] == null) continue;
        const iata = row[idx.iata];
        if (!iata) continue;
        const lat = parseFloat(row[idx.lat]);
        const lng = parseFloat(row[idx.lng]);
        if (isNaN(lat) || isNaN(lng)) continue;
        airports.push({
            skyId:    iata,
            entityId: row[idx.ident],
            name:     row[idx.name],
            coords:   [lng, lat],
        });
    }
    return airports;
}

export async function fetchAirportByIata(iata: string): Promise<Airport | null> {
    const csv = await getAirportsCsv();
    const lines = csv.split('\n');
    const header = parseCsvRow(lines[0]);
    const idx = {
        ident: header.indexOf('ident'),
        name:  header.indexOf('name'),
        lat:   header.indexOf('latitude_deg'),
        lng:   header.indexOf('longitude_deg'),
        iata:  header.indexOf('iata_code'),
    };
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = parseCsvRow(lines[i]);
        if (row[idx.iata].trim() !== iata.trim()) continue;
        const lat = parseFloat(row[idx.lat]);
        const lng = parseFloat(row[idx.lng]);
        if (isNaN(lat) || isNaN(lng)) continue;
        return { skyId: iata, entityId: row[idx.ident], name: row[idx.name], coords: [lng, lat] };
    }
    return null;
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
            : '#3a353b';

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
