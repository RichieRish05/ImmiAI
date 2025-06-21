import firecrawl_locations
#coords stores a list of tuples stored as [(lat,lon),...]
coords = firecrawl_locations.lat_lon()
for coord in coords:
    print(coord)