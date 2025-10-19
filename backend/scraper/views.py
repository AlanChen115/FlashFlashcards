from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import scrape_article

# Create your views here.
@api_view(['POST'])
def scrape(request):
    url = request.data.get('url')
    if not url:
        return Response({"error": "No URL provided"}, status=400)
    data = scrape_article(url)
    return Response(data)