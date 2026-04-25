from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

import skyscanner

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok"}


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
