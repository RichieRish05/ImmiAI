# backend/firecrawl_locations.py

from firecrawl import FirecrawlApp, ScrapeOptions
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from geopy.geocoders import ArcGIS
from concurrent.futures import ThreadPoolExecutor
import os
from datetime import datetime

load_dotenv()
API_KEY = os.getenv("FIRECRAWL_API")
app = FirecrawlApp(api_key=API_KEY)

def lat_lon():
    now = datetime.now().strftime("%Y-%m-%d")
    # 1) Scrape HTML
    scrape_status = app.scrape_url(
        'https://padlet.com/PeopleoverPapers/people-over-papers-anonymous-anonimo-lf0l47ljszbto2uj',
        formats=['html']
    )
    html = scrape_status.html or ''
    if not html:
        return []

    # 2) Extract raw text
    soup = BeautifulSoup(html, 'html.parser')
    elements = soup.select(
        '.text-body-small'
        '.line-clamp-1'
        '.break-word-anywhere'
        '.whitespace-break-spaces'
        '.text-dark-text-100'
    )
    texts = [el.get_text(strip=True) for el in elements]

    # 2a) Pre-extract “city” candidates
    country_codes = {'USA', 'UNITED STATES', 'EE. UU.'}
    city_names = []
    for entry in texts:
        if entry.startswith("(") and entry.endswith(")"):
            city_names.append(None)
            continue
        parts = [p.strip() for p in entry.split(',')]
        if parts and parts[-1].upper() in country_codes:
            parts.pop()
        city_names.append(parts[-2] if len(parts) >= 2 else parts[0])

    # 3) ArcGIS geocoder (no API key needed)
    geolocator = ArcGIS(timeout=10)

    def geocode_forward(entry: str):
        try:
            if entry.startswith("(") and entry.endswith(")"):
                lat, lon = map(float, entry[1:-1].split(",", 1))
                return lat, lon
            loc = geolocator.geocode(entry)
            if loc:
                return loc.latitude, loc.longitude
        except Exception:
            pass
        return None, None

    # 4) Run in parallel
    with ThreadPoolExecutor(max_workers=10) as executor:
        coords = list(executor.map(geocode_forward, texts))

    # 5) Build results, reverse if needed
    results = []
    for idx, (city, (lat, lon)) in enumerate(zip(city_names, coords)):
        if city is None and lat is not None and lon is not None:
            try:
                rev = geolocator.reverse((lat, lon), exactly_one=True)
                addr = rev.address if hasattr(rev, 'address') else rev
                city = addr.split(',')[0] if addr else None
            except Exception:
                city = None

        results.append({
            "id": idx,
            "lat": lat,
            "lon": lon,
            "city": city,
            "date": now
        })
    return results


if __name__ == "__main__":
    for item in lat_lon():
        print(item)
