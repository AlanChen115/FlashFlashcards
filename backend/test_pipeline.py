import requests
import json

BASE_URL = "http://localhost:8000"

# Step 1: Scrape
url_to_scrape = "https://news.web.nhk/news/easy/ne2025101717473/ne2025101717473.html"
resp = requests.post(f"{BASE_URL}/api/scraper/scrape/", json={"url": url_to_scrape})
scraped_data = resp.json()
body_text = scraped_data.get("body_text", "")

# Step 2: Parse
resp2 = requests.post(f"{BASE_URL}/api/ai_generator/parse/", json={"body_text": body_text, "language": "Japanese"})
parsed_data = resp2.json()
flashcards = parsed_data.get("output", {}).get("flashcards", [])

# Step 3: Export
resp3 = requests.post(f"{BASE_URL}/api/exporter/anki/", json={"flashcards": flashcards})
print(resp3.json())