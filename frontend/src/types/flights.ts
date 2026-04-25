export interface Layover {
    airport: string;
    airportName: string;
    city: string;
    waitMinutes: number;
}

export interface FlightLeg {
    from: string;
    fromName: string;
    to: string;
    toName: string;
    depart: string;
    arrive: string;
    durationMin: number;
    stops: number;
    carrier: string;
    carrierLogo: string;
    layovers: Layover[];
    primaryLayover: Layover | null;
}

export interface FlightResult {
    id: string;
    price: number;
    deepLink: string;
    outbound: FlightLeg;
    inbound: FlightLeg | null;
}
