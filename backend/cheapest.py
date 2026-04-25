from datetime import datetime


def to_datetime(dt: dict) -> datetime:
    return datetime(dt["year"], dt["month"], dt["day"], dt["hour"], dt["minute"])


def format_datetime(dt: dict) -> str:
    return f"{dt['year']:04d}-{dt['month']:02d}-{dt['day']:02d}T{dt['hour']:02d}:{dt['minute']:02d}"


def city_for_airport(airport_id: str, places: dict) -> str:
    airport = places.get(airport_id, {})
    parent_id = airport.get("parentId")
    if parent_id and parent_id in places:
        return places[parent_id]["name"]
    return airport.get("name", "")


def build_layovers(leg: dict, segments: dict, places: dict) -> list[dict]:
    leg_segments = [segments[sid] for sid in leg["segmentIds"]]
    layovers = []
    for prev, nxt in zip(leg_segments, leg_segments[1:]):
        airport_id = prev["destinationPlaceId"]
        wait = to_datetime(nxt["departureDateTime"]) - to_datetime(prev["arrivalDateTime"])
        layovers.append({
            "airport": places[airport_id]["iata"],
            "airportName": places[airport_id]["name"],
            "city": city_for_airport(airport_id, places),
            "waitMinutes": int(wait.total_seconds() // 60),
            "arriveAt": format_datetime(prev["arrivalDateTime"]),
            "departAt": format_datetime(nxt["departureDateTime"]),
        })
    return layovers


def build_leg(leg_id: str, legs: dict, segments: dict, carriers: dict, places: dict) -> dict:
    leg = legs[leg_id]
    carrier_id = leg["marketingCarrierIds"][0]
    layovers = build_layovers(leg, segments, places)
    primary = max(layovers, key=lambda l: l["waitMinutes"]) if layovers else None
    return {
        "from": places[leg["originPlaceId"]]["iata"],
        "fromName": places[leg["originPlaceId"]]["name"],
        "to": places[leg["destinationPlaceId"]]["iata"],
        "toName": places[leg["destinationPlaceId"]]["name"],
        "depart": format_datetime(leg["departureDateTime"]),
        "arrive": format_datetime(leg["arrivalDateTime"]),
        "durationMin": leg["durationInMinutes"],
        "stops": leg["stopCount"],
        "carrier": carriers[carrier_id]["name"],
        "carrierLogo": carriers[carrier_id]["imageUrl"],
        "layovers": layovers,
        "primaryLayover": primary,
    }


def find_cheapest(raw: dict, limit: int = 10, with_layover: bool = False) -> list[dict]:
    content = raw.get("content", {}).get("results", {})
    itineraries = content.get("itineraries", {})
    legs = content.get("legs", {})
    segments = content.get("segments", {})
    carriers = content.get("carriers", {})
    places = content.get("places", {})

    flights = []
    for itinerary_id, itinerary in itineraries.items():
        if not itinerary.get("pricingOptions"):
            continue
        option = itinerary["pricingOptions"][0]
        price_pennies = int(option["price"]["amount"])
        leg_ids = itinerary["legIds"]

        flights.append({
            "id": itinerary_id,
            "price": price_pennies / 1000,
            "deepLink": option["items"][0]["deepLink"],
            "outbound": build_leg(leg_ids[0], legs, segments, carriers, places),
            "inbound": build_leg(leg_ids[1], legs, segments, carriers, places) if len(leg_ids) > 1 else None,
        })

    if with_layover:
        flights = [f for f in flights if f["outbound"]["stops"] >= 1]

    flights.sort(key=lambda f: f["price"])
    return flights[:limit]


def find_cheapest_direct_price(raw: dict) -> float | None:
    content = raw.get("content", {}).get("results", {})
    itineraries = content.get("itineraries", {})
    legs = content.get("legs", {})

    cheapest = None
    for itinerary in itineraries.values():
        if not itinerary.get("pricingOptions"):
            continue
        leg_ids = itinerary["legIds"]
        if any(legs[lid]["stopCount"] != 0 for lid in leg_ids):
            continue
        price = int(itinerary["pricingOptions"][0]["price"]["amount"]) / 1000
        if cheapest is None or price < cheapest:
            cheapest = price
    return cheapest
