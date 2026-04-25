import httpx

from .config import settings

BASE_URL = "https://partners.api.skyscanner.net/apiservices/v3"

HEADERS = {
    "x-api-key": settings.skyscanner_api_key,
    "Content-Type": "application/json",
}


def _build_create_payload(
    origin_iata: str,
    destination_iata: str,
    year: int,
    month: int,
    day: int,
    market: str = "UK",
    locale: str = "en-GB",
    currency: str = "GBP",
    adults: int = 1,
    cabin_class: str = "CABIN_CLASS_ECONOMY",
) -> dict:
    return {
        "query": {
            "market": market,
            "locale": locale,
            "currency": currency,
            "queryLegs": [
                {
                    "originPlaceId": {"iata": origin_iata},
                    "destinationPlaceId": {"iata": destination_iata},
                    "date": {"year": year, "month": month, "day": day},
                }
            ],
            "adults": adults,
            "cabinClass": cabin_class,
        }
    }


async def create_search(
    origin_iata: str,
    destination_iata: str,
    year: int,
    month: int,
    day: int,
) -> dict:
    payload = _build_create_payload(origin_iata, destination_iata, year, month, day)
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{BASE_URL}/flights/live/search/create",
            headers=HEADERS,
            json=payload,
        )
        response.raise_for_status()
        return response.json()


async def poll_search(session_token: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{BASE_URL}/flights/live/search/poll/{session_token}",
            headers=HEADERS,
        )
        response.raise_for_status()
        return response.json()
