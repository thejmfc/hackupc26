const geojsonUrl = "https://cdn.jsdelivr.net/gh/gavinr/world-countries-centroids@v1/dist/countries.geojson";

export let countries: GeoJSON.Country[] = [];

fetch(geojsonUrl)
    .then(res => res.json())
    .then(geojson => {
        geojson.features.forEach((feature: GeoJSON.Feature) => {
            countries.push(new GeoJSON.Country(feature));
        });
    })
    .catch(err => {
        console.log(`Error fetching GeoJSON: ${err}`);
    });