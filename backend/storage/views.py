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

    result = ingest_accepted_flashcards(flashcards, language)

    return Response(result)

@api_view(['GET'])
def similar(request):
    flashcards = request.data.get('flashcards', [])
    result = similar_check(flashcards)
    return Response(result)