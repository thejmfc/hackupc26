import asyncio
import json
import os
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import skyscanner
from . import gemini
from .cheapest import find_cheapest, find_cheapest_direct_price

app = FastAPI()

BASE_URL = skyscanner.BASE_URL
HEADERS = skyscanner.HEADERS
generate_with_prompt = gemini.generate_with_prompt

POLL_INTERVAL = 2
MAX_POLLS = 15
MOCK_MODE = os.getenv("MOCK_MODE", "").lower() in ("1", "true", "yes")
MOCK_DIR = Path(__file__).parent / "mocks"


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_mock(name: str) -> dict | None:
    path = MOCK_DIR / f"{name}.json"
    if not path.exists():
        return None
    with path.open() as f:
        return json.load(f)


@app.get("/api/health")
async def health():
    return {"status": "ok", "mockMode": MOCK_MODE}


@app.get("/api/generate")
async def generate(prompt: str):
    print(f"Received prompt: {prompt}")
    return generate_with_prompt(prompt)


@app.get("/api/calculate-value")
async def calculate_value(
    direct_price: float,
    layover_price: float,
    estimated_spend: float = 0,
):
    """Net saving and a value score for a layover trip vs going direct."""
    saving = direct_price - layover_price
    net = saving - estimated_spend
    value_score = max(0, min(10, round(net / max(direct_price, 1) * 10, 1)))
    return {
        "directPrice": round(direct_price, 2),
        "layoverPrice": round(layover_price, 2),
        "estimatedSpend": round(estimated_spend, 2),
        "saving": round(saving, 2),
        "netSaving": round(net, 2),
        "valueScore": value_score,
    }


@app.get("/flights")
async def flights(origin: str, destination: str, year: int, month: int, day: int):
    if MOCK_MODE:
        mock = _load_mock(f"{origin.upper()}_{destination.upper()}") or _load_mock("default")
        if mock is None:
            raise HTTPException(status_code=503, detail="Mock mode on but no mocks available")
        return {
            "flights": find_cheapest(mock, limit=10),
            "directPrice": find_cheapest_direct_price(mock),
            "mock": True,
        }

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

    try:
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
                raise HTTPException(status_code=502, detail="Skyscanner did not return a sessionToken")

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
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Skyscanner timed out")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Skyscanner error: {e.response.text[:200]}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Skyscanner connection error: {e}")

    return {
        "flights": find_cheapest(merged, limit=10),
        "directPrice": find_cheapest_direct_price(merged),
    }
