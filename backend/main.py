import httpx
from fastapi import FastAPI

from skyscanner import BASE_URL, HEADERS

app = FastAPI()


@app.get("/flights")
async def flights(origin: str, destination: str, year: int, month: int, day: int):
    payload = {
        "query": {
            "market": "UK",
            "locale": "en-GB",
            "currency": "GBP",
            "queryLegs": [
                {
                    "originPlaceId": {"iata": origin},
                    "destinationPlaceId": {"iata": destination},
                    "date": {"year": year, "month": month, "day": day},
                }
            ],
            "adults": 1,
            "cabinClass": "CABIN_CLASS_ECONOMY",
        }
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{BASE_URL}/flights/live/search/create", headers=HEADERS, json=payload
        )
        response.raise_for_status()
        return response.json()


