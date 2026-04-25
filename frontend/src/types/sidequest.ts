export interface Activity {
    type: string;
    description: string;
    time_to_complete: number;
    time_to_travel?: number;
    price: number;
    latitude: number;
    longitude: number;
}

export interface SidequestResponse {
    layover_airport: string;
    layover_flight_arrival: string;
    layover_flight_departure: string;
    time_to_complete_quests: number;
    sidequests: Activity[];
}
