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
#add this functionality later after finishing everything else
@api_view(['POST'])
def batch_scrape(request):
    urls = request.data.get('urls', [])
    data = []
    if not urls:
        return Response({"error": "No URLs provided"}, status=400)
    for url in urls:
        data.append(scrape_article(url))

    return Response(data)
