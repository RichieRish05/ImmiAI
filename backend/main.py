# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import firecrawl_locations
app = FastAPI()

# allow your Next.js frontend to fetch
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# in-memory cache
_raids_cache = []

@app.on_event("startup")
def load_raids():
    global _raids_cache
    # Blocks ~30–60s on startup, then serves instantly thereafter
    _raids_cache = firecrawl_locations.lat_lon()

@app.get("/raids")
def get_raids():
    return _raids_cache

