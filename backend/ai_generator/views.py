from rest_framework.decorators import api_view
from rest_framework.response import Response
from ai_generator.scraper.scraper import scrape_article
from ai_generator.image_recognition import get_text_from_image
from .flashcard_generator import parse_article

# sends a json with text and generates data for the flashcards
@api_view(['POST'])
def parse(request):
    url = request.data.get('url')
    if not url:
        return Response({"error": "No URL provided"}, status=400)
    data = scrape_article(url)

    text = data["body_text"]
    language = request.data.get('language')
    if not text:
        return Response({"error": "No text provided"}, status=400)
    if not language:
        return Response({"error": "No language provided"}, status=400)
    data = parse_article(text, language)

    print(data)
    return Response(data)

@api_view(['POST'])
def parse_website(request):
    urls = request.data.get('urls', [])
    language = request.data.get('language')

    if not language:
        return Response({"error": "No language provided"}, status=400)
    if not urls:
        return Response({"error": "No URL(s) provided"}, status=400)

    output = []
    for url in urls:
        scraped = scrape_article(url)
        text = scraped.get("body_text", "")

        if not text:
            return Response({"error": f"No text found at {url}"}, status=400)

        parsed = parse_article(text, language)

        if parsed.get("error"):
            return Response({"error": f"Failed to parse {url}: {parsed['error']}"}, status=500)

        flashcards = (parsed.get("output") or {}).get("flashcards", [])
        output.append({"url": url, "flashcards": flashcards})

    return Response({"output": output, "error": None})

@api_view(['POST'])
def parse_images(request):
    imageFiles = request.FILES.getlist('files')
    if not imageFiles:
        return Response({"error": "No images provided"}, status=400)
    language = request.data.get('language')
    if not language:
        return Response({"error": "No language provided"}, status=400)
    output = []
    for imageFile in imageFiles:
        text = get_text_from_image(imageFile, language)
        output.append({"image": imageFile.name, "flashcards": parse_article(text, language).get("output", {}).get("flashcards", [])})
    return Response({"output": output, "error": None})
    