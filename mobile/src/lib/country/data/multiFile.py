import json
import os

# Load the dataset
with open('city.json', 'r') as file:
    dataset = json.load(file)

# Group cities by country code
cities_by_country = {}
for city in dataset:
    country_code = city[1]
    if country_code not in cities_by_country:
        cities_by_country[country_code] = []
    cities_by_country[country_code].append(city)

# Define a function to split country codes into ranges
def split_country_codes(codes):
    ranges = []
    sorted_codes = sorted(codes)
    start = sorted_codes[0]
    for i in range(1, len(sorted_codes)):
        if sorted_codes[i] != sorted_codes[i-1][-1] + 1:
            ranges.append((start, sorted_codes[i-1]))
            start = sorted_codes[i]
    ranges.append((start, sorted_codes[-1]))
    return ranges

# Split country codes into ranges and write each range to a file
for country_code, cities in cities_by_country.items():
    ranges = split_country_codes([country_code])
    for i, (start, end) in enumerate(ranges):
        filename = f'cities_{start}-{end}.json'
        with open(filename, 'w') as file:
            json.dump(cities, file, indent=2)
        print(f'Wrote {len(cities)} cities to {filename}')
