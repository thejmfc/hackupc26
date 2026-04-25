import asyncio

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = "https://partners.api.skyscanner.net/apiservices/v3"
HEADERS = {"x-api-key": settings.skyscanner_api_key}


@app.get("/flights")
async def flights(
    origin: str,
    destination: str,
    year: int,
    month: int,
    day: int,
    return_year: int | None = None,
    return_month: int | None = None,
    return_day: int | None = None,
):
    query_legs = [
        {
            "originPlaceId": {"iata": origin},
            "destinationPlaceId": {"iata": destination},
            "date": {"year": year, "month": month, "day": day},
        }
    ]
    if return_year and return_month and return_day:
        query_legs.append(
            {
                "originPlaceId": {"iata": destination},
                "destinationPlaceId": {"iata": origin},
                "date": {"year": return_year, "month": return_month, "day": return_day},
            }
        )

    payload = {
        "query": {
            "market": "UK",
            "locale": "en-GB",
            "currency": "GBP",
            "queryLegs": query_legs,
            "adults": 1,
            "cabinClass": "CABIN_CLASS_ECONOMY",
        }
    }

    async with httpx.AsyncClient(timeout=60) as client:
        create = await client.post(
            f"{BASE_URL}/flights/live/search/create", headers=HEADERS, json=payload
        )
        create.raise_for_status()
        data = create.json()
        token = data["sessionToken"]

        for _ in range(40):
            if data["status"] == "RESULT_STATUS_COMPLETE":
                break
            if data.get("content", {}).get("results", {}).get("itineraries"):
                break
            await asyncio.sleep(1.5)
            poll = await client.post(
                f"{BASE_URL}/flights/live/search/poll/{token}", headers=HEADERS
            )
            poll.raise_for_status()
            data = poll.json()

        return data
