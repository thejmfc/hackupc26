const geojsonUrl = "https://cdn.jsdelivr.net/gh/gavinr/world-countries-centroids@v1/dist/countries.geojson";

export class Country {
    name: string;
    coords: Array<number>;

    constructor(name: string, coords: Array<number>) {
        this.name = name;
        this.coords = coords;
    }
}

export let countries: Country[] = [];

fetch(geojsonUrl)
    .then(res => res.json())
    .then(geojson => {
        geojson.features.forEach(feature => {
            countries.push(new Country(
                feature.properties.COUNTRY,
                feature.geometry.coordinates));
        });
    })
    .catch(err => {
        console.log(`Error fetching GeoJSON: ${err}`);
    });