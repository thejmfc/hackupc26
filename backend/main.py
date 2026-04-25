import asyncio

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .gemini import generate_with_prompt
from . import skyscanner

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = "https://partners.api.skyscanner.net/apiservices/v3"
HEADERS = {"x-api-key": settings.skyscanner_api_key}


@app.get("/health")
def root():
    return {"status": "ok"}


@app.get("/api/generate")
async def generate(prompt: str):
    print(f"Received prompt: {prompt}")
    return generate_with_prompt(prompt)


@app.get("/airports")
async def airports(query: str):
    try:
        return await skyscanner.search_airport(query)
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)


@app.get("/flights/search")
async def flights_search(
    origin_sky_id: str,
    destination_sky_id: str,
    origin_entity_id: str,
    destination_entity_id: str,
    date: str,
):
    try:
        return await skyscanner.search_flights(
            origin_sky_id=origin_sky_id,
            destination_sky_id=destination_sky_id,
            origin_entity_id=origin_entity_id,
            destination_entity_id=destination_entity_id,
            date=date,
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)


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
