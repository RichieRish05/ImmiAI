from firecrawl import FirecrawlApp, ScrapeOptions
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from geopy.geocoders import ArcGIS
from concurrent.futures import ThreadPoolExecutor
import os
from datetime import datetime

now = datetime.now()
now_str = str(now)
now_list = now_str.split()
date = now_list[0]

load_dotenv()
app = FirecrawlApp(api_key=os.getenv("FIRECRAWL_API"))

def lat_lon():
    # 1) Scrape HTML
    scrape_status = app.scrape_url(
        'https://padlet.com/PeopleoverPapers/people-over-papers-anonymous-anonimo-lf0l47ljszbto2uj',
        formats=['html']
    )
    html = scrape_status.html or ''
    if not html:
        raise RuntimeError("No HTML returned!")

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

    print(f"Number of raids: {len(texts)}")

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

    # 3) ArcGIS geocoder
    geolocator = ArcGIS(timeout=10)

    def geocode_forward(entry: str):
        # already a "(lat, lon)" tuple?
        if entry.startswith("(") and entry.endswith(")"):
            lat, lon = map(float, entry[1:-1].split(",", 1))
            return lat, lon
        loc = geolocator.geocode(entry)
        return (loc.latitude, loc.longitude) if loc else (None, None)

    # 4) Geocode in parallel
    with ThreadPoolExecutor(max_workers=10) as executor:
        coords = list(executor.map(geocode_forward, texts))

    # 5) Build result dicts, reverse-geocoding missing cities
    results = []
    id_num = 0
    for city, (lat, lon) in zip(city_names, coords):
        if city is None and lat is not None and lon is not None:
            rev = geolocator.reverse((lat, lon), exactly_one=True)
            # ArcGIS.reverse() may return a Location or a raw string
            addr = rev.address if hasattr(rev, 'address') else rev
            city = addr.split(',')[0] if addr else None

        results.append({
            "id": id_num,
            "lat": lat,
            "lon": lon,
            "city": city,
            "date": date
        })
        id_num += 1

    return results

if __name__ == "__main__":
    for item in lat_lon():
        print(item)
