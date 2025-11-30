from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import parse_article

# sends a json with text and generates data for the flashcards
@api_view(['POST'])
def parse(request):
    text = request.data.get('body_text')
    language = "Japanese"
    if not text:
        return Response({"error": "No text provided"}, status=400)
    data = parse_article(text, language)

    print(data)
    return Response(data)

@api_view(['POST'])
def batch_parse(request):
    pass

