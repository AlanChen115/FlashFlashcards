from rest_framework.decorators import api_view
from rest_framework.response import Response
from storage.services import ingest_accepted_flashcards, similar_check
from storage.importer import import_flashcard_file
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

@api_view(['POST'])
def import_flashcards(request):
    files = request.FILES.getlist('files')
    if not files:
        return Response({"output": None, "error": "No file provided"}, status=400)
    language = request.data.get('language')
    if not language:
        return Response({"output": None, "error": "No language provided"}, status=400)

    flashcards = []

    for file in files:
        try:
            flashcards.extend(import_flashcard_file(file, language))
        except ValueError as e:
            return Response({"output": None, "error": str(e)}, status=400)

  ## I don't know if I want to return all or just similar flashcards for confirmation.
    checked = similar_check(flashcards, language)
    return Response({"output": checked, "error": None})
