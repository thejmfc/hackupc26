def format_datetime(dt: dict) -> str:
    return f"{dt['year']:04d}-{dt['month']:02d}-{dt['day']:02d}T{dt['hour']:02d}:{dt['minute']:02d}"


def build_leg(leg_id: str, legs: dict, carriers: dict, places: dict) -> dict:
    leg = legs[leg_id]
    carrier_id = leg["marketingCarrierIds"][0]
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
    }


def find_cheapest(raw: dict, limit: int = 10) -> list[dict]:
    content = raw.get("content", {}).get("results", {})
    itineraries = content.get("itineraries", {})
    legs = content.get("legs", {})
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
            "outbound": build_leg(leg_ids[0], legs, carriers, places),
            "inbound": build_leg(leg_ids[1], legs, carriers, places) if len(leg_ids) > 1 else None,
        })

    flights.sort(key=lambda f: f["price"])
    return flights[:limit]
