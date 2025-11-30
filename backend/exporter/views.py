from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response

from exporter.utils import export_anki

# Create your views here.
@api_view(['POST'])
def anki(request):
    flashcards = request.data.get('flashcards')
    if not flashcards:
        return Response({"error": "No flashcards provided"}, status=400)
    data = export_anki(flashcards)
    return Response(data)

#add this functionality later after finishing everything else
@api_view(['POST'])
def quizlet(request):
    pass