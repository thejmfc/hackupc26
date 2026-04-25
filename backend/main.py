import asyncio
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import skyscanner
import gemini

from cheapest import find_cheapest

app = FastAPI()

BASE_URL = skyscanner.BASE_URL
HEADERS = skyscanner.HEADERS
generate_with_prompt = gemini.generate_with_prompt

POLL_INTERVAL = 2
MAX_POLLS = 15


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/generate")
async def generate(prompt: str):
    print(f"Received prompt: {prompt}")
    return generate_with_prompt(prompt)


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
        r = await client.post(
            f"{BASE_URL}/flights/live/search/create",
            headers=HEADERS,
            json=payload,
        )
        r.raise_for_status()
        data = r.json()

        session_token = data.get("sessionToken")
        if not session_token:
            raise HTTPException(status_code=500, detail="Missing sessionToken")

        merged = data

        for _ in range(MAX_POLLS):
            if merged.get("status") == "RESULT_STATUS_COMPLETE":
                break
            await asyncio.sleep(POLL_INTERVAL)
            poll = await client.post(
                f"{BASE_URL}/flights/live/search/poll/{session_token}",
                headers=HEADERS,
            )
            poll.raise_for_status()
            merged = poll.json()

    return {"flights": find_cheapest(merged, limit=10)}




