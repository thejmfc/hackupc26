const geojsonUrl = "https://cdn.jsdelivr.net/gh/gavinr/world-countries-centroids@v1/dist/countries.geojson";

export type Coordinates = [number, number];

export type Feature = {
    geometry: { coordinates: Coordinates };
    properties: { COUNTRY: string, ISO: string };
}

export class Country {
    name: string;
    code: string;
    coords: Coordinates;

    constructor(feature: Feature) {
        this.name = feature.properties.COUNTRY;
        this.code = feature.properties.ISO;
        this.coords = feature.geometry.coordinates;
    }
}

let countries: Country[] = [];

fetch(geojsonUrl)
    .then(res => res.json())
    .then(geojson => {
        geojson.features.forEach((feature: Feature) => {
            countries.push(new Country(feature));
        });
    })
    .catch(err => {
        console.log(`Error fetching GeoJSON: ${err}`);
    });

export default countries;