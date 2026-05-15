from django.http import HttpResponse
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from storage.services import ingest_accepted_flashcards, similar_check

# Create your views here.
@api_view(['POST'])
def commit(request):
    data = request.data
    flashcards = data.get('flashcards', [])
    language = data.get('language', 'Unknown')

    if not flashcards:
        return Response({"output": None, "error": "No flashcards provided"}, status=400)

    result = ingest_accepted_flashcards(flashcards, language)

    return Response({"output": result, "error": None})

@api_view(['POST'])
def similar(request):
    data = request.data
    flashcards = data.get('flashcards', [])
    language = data.get('language', 'Unknown')

    if not flashcards:
        return Response({"output": None, "error": "No flashcards provided"}, status=400)

    result = similar_check(flashcards, language)
    return Response({"output": result, "error": None})
