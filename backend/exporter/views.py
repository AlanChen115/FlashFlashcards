from django.http import HttpResponse
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response

from exporter.utils import export_anki, export_quizlet

# Create your views here.
@api_view(['POST'])
def anki(request):
    flashcards = request.data.get('flashcards')
    if not flashcards:
        return Response({"error": "No flashcards provided"}, status=400)
    data = export_anki(flashcards)
    return Response(data)

    # Uncomment below to return as a downloadable file
    # response = HttpResponse(
    #     buffer.getvalue(),
    #     content_type="application/octet-stream"
    # )
    # response['Content-Disposition'] = 'attachment; filename="flashcards.apkg"'

    # return response

#add this functionality later after finishing everything else
@api_view(['POST'])
def quizlet(request):
    flashcards = request.data.get('flashcards')
    if not flashcards:
        return Response({"error": "No flashcards provided"}, status=400)
    data = export_quizlet(flashcards)
    response = HttpResponse(data, content_type="text/plain; charset=utf-8")
    response['Content-Disposition'] = 'attachment; filename="quizlet_export.txt"'
    return response