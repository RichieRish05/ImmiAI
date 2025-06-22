import asyncio
import os
from datetime import datetime
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import httpx
from firecrawl import FirecrawlApp

load_dotenv()
API_KEY = os.getenv('FIRECRAWL_API')
# Initialize Firecrawl SDK
app = FirecrawlApp(api_key=API_KEY)

# ArcGIS REST API endpoints for geocoding
ARC_GIS_FIND_URL = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates'
ARC_GIS_REVERSE_URL = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode'

async def fetch_html(url: str) -> str:
    """
    Async wrapper around FirecrawlApp.scrape_url to avoid blocking.
    """
    loop = asyncio.get_running_loop()
    # Offload the blocking scrape_url call to a thread
    scrape_status = await loop.run_in_executor(
        None,
        lambda: app.scrape_url(url, formats=['html'])
    )
    return scrape_status.html or ''

async def geocode_address(entry: str) -> tuple[float, float]:
    if entry.startswith('(') and entry.endswith(')'):
        lat, lon = map(float, entry[1:-1].split(',', 1))
        return lat, lon
    params = {'singleLine': entry, 'f': 'json', 'outFields': 'Match_addr'}
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(ARC_GIS_FIND_URL, params=params)
        resp.raise_for_status()
        data = resp.json()
        candidates = data.get('candidates', [])
        if candidates:
            loc = candidates[0]['location']
            return loc['y'], loc['x']
    return None, None

async def reverse_geocode(lat: float, lon: float) -> str | None:
    params = {'location': f'{lon},{lat}', 'f': 'json'}
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(ARC_GIS_REVERSE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()
        return data.get('address', {}).get('Address')

async def lat_lon() -> list[dict]:
    now = datetime.now().strftime('%Y-%m-%d')
    url = 'https://padlet.com/PeopleoverPapers/people-over-papers-anonymous-anonimo-lf0l47ljszbto2uj'
    html = await fetch_html(url)
    if not html:
        return []

    soup = BeautifulSoup(html, 'html.parser')
    selector = (
        '.text-body-small'
        '.line-clamp-1'
        '.break-word-anywhere'
        '.whitespace-break-spaces'
        '.text-dark-text-100'
    )
    elements = soup.select(selector)
    texts = [el.get_text(strip=True) for el in elements]

    country_codes = {'USA', 'UNITED STATES', 'EE. UU.'}
    city_candidates = []
    for entry in texts:
        if entry.startswith('(') and entry.endswith(')'):
            city_candidates.append(None)
        else:
            parts = [p.strip() for p in entry.split(',')]
            if parts and parts[-1].upper() in country_codes:
                parts.pop()
            city_candidates.append(parts[-2] if len(parts) >= 2 else parts[0])

    coords = await asyncio.gather(*(geocode_address(txt) for txt in texts))

    results = []
    for idx, ((lat, lon), city) in enumerate(zip(coords, city_candidates)):
        if city is None and lat is not None and lon is not None:
            address = await reverse_geocode(lat, lon)
            city = address.split(',')[0] if address else None
        results.append({
            'id': idx,
            'lat': lat,
            'lon': lon,
            'city': city,
            'date': now
        })
    return results

if __name__ == '__main__':
    items = asyncio.run(lat_lon_async())
    for item in items:
        print(item)
