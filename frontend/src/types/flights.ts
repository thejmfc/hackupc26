export interface AirportOption {
    skyId: string;
    entityId: string;
    name: string;
    subtitle: string;
}

export interface FlightCarrier {
    name: string;
    logoUrl: string;
}

export interface FlightEndpoint {
    displayCode: string;
    name?: string;
    city?: string;
}

export interface FlightLeg {
    origin: FlightEndpoint;
    destination: FlightEndpoint;
    departure: string;
    arrival: string;
    durationInMinutes: number;
    stopCount: number;
    carriers: {
        marketing: FlightCarrier[];
    };
}

export interface FlightResult {
    id: string;
    price: { raw: number; formatted: string };
    legs: FlightLeg[];
}
