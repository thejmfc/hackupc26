declare global {
    namespace GeoJSON {
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
    }
}

export {};