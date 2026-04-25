import httpx

from config import settings

BASE_URL = f"https://{settings.skyscanner_api_host}"

HEADERS = {
    "x-rapidapi-key": settings.skyscanner_api_key,
    "x-rapidapi-host": settings.skyscanner_api_host,
}


async def search_airport(query: str) -> dict:
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(
            f"{BASE_URL}/api/v1/flights/searchAirport",
            headers=HEADERS,
            params={"query": query, "locale": "en-US"},
        )
        response.raise_for_status()
        return response.json()


async def search_flights(
    origin_sky_id: str,
    destination_sky_id: str,
    origin_entity_id: str,
    destination_entity_id: str,
    date: str,
) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(
            f"{BASE_URL}/api/v2/flights/searchFlights",
            headers=HEADERS,
            params={
                "originSkyId": origin_sky_id,
                "destinationSkyId": destination_sky_id,
                "originEntityId": origin_entity_id,
                "destinationEntityId": destination_entity_id,
                "date": date,
                "cabinClass": "economy",
                "adults": 1,
                "currency": "EUR",
                "market": "en-US",
                "countryCode": "ES",
            },
        )
        response.raise_for_status()
        return response.json()
