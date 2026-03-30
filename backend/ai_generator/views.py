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
def batch_parse(request):
    urls = request.data.get('urls', [])
    data = []
    if not urls:
        return Response({"error": "No URLs provided"}, status=400)
    for url in urls:
        data.append(scrape_article(url))

    texts = [item["body_text"] for item in data]
    language = request.data.get('language')
    data = []
    if not texts:
        return Response({"error": "No texts provided"}, status=400)
    if not language:
        return Response({"error": "No language provided"}, status=400)
    for text in texts:
        data = data + parse_article(text, language).get("output", {}).get("flashcards", [])

    return Response({"output": {"flashcards": data}, "error": None})

@api_view(['POST'])
def parse_image(request):
    imageFile = request.FILES.get('image')
    if not imageFile:
        return Response({"error": "No image provided"}, status=400)
    language = request.data.get('language')
    if not language:
        return Response({"error": "No language provided"}, status=400)
    text = get_text_from_image(imageFile, language)
    data = parse_article(text, language)
    return Response(data)

@api_view(['POST'])
def parse_images(request):
    imageFiles = request.FILES.getlist('images')
    if not imageFiles:
        return Response({"error": "No images provided"}, status=400)
    language = request.data.get('language')
    if not language:
        return Response({"error": "No language provided"}, status=400)
    data = []
    for imageFile in imageFiles:
        text = get_text_from_image(imageFile, language)
        data = data + parse_article(text, language).get("output", {}).get("flashcards", [])
    return Response({"output": {"flashcards": data}, "error": None})
    