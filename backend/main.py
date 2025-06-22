# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import firecrawl_locations
import uvicorn

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

@app.get("/refresh")
def refresh():
    load_raids()

@app.get("/raids")
def get_raids():
    return _raids_cache

if __name__ == "__main__":
    # Change host to "0.0.0.0" so it listens on all interfaces
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=80,
        log_level="info",
        # reload=True,  # uncomment for auto-reload in dev
    )
