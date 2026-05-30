from rest_framework.decorators import api_view
from rest_framework.response import Response
from storage.services import get_languages, ingest_accepted_flashcards, search_flashcards, similar_check, clear_db, remove_flashcard, get_all_flashcards, update_flashcard
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

@api_view(['POST'])
def clear(request):
    result = clear_db()
    return Response({"output": result, "error": None})

@api_view(['POST'])
def remove(request):
    data = request.data
    flashcards = data.get('flashcards')
    language = data.get('language')

    if not flashcards:
        return Response({"output": None, "error": "No flashcards provided"}, status=400)

    result = remove_flashcard(flashcards, language)

    if result["deleted_count"] == 0:
        return Response({"output": result, "error": "Flashcards not found"}, status=404)

    return Response({"output": result, "error": None})

@api_view(['GET'])
def all_flashcards(request):
    flashcards = get_all_flashcards()
    return Response({"output": list(flashcards), "error": None})

@api_view(['GET'])
def search(request):
    query = request.query_params.get('q', '').strip()
    language = request.query_params.get('language', '').strip()

    results = search_flashcards(query, language)

    return Response({"output": results, "error": None})

@api_view(['GET'])
def languages(request):
    result = get_languages()
    return Response({"output": result, "error": None})

@api_view(['POST'])
def update(request):
    data = request.data
    card_id = data.get('id') or data.get('card_id') or data.get('cardId')

    if not card_id:
        return Response({"output": None, "error": "No flashcard id provided"}, status=400)

    result = update_flashcard(
        card_id=card_id,
        front=data.get('front'),
        back=data.get('back'),
        lemma=data.get('lemma'),
        language=data.get('language'),
    )

    if result["not_found"]:
        return Response({"output": None, "error": "Flashcard not found"}, status=404)

    if result["duplicate"]:
        return Response({"output": None, "error": "A flashcard with this front and back already exists"}, status=409)

    return Response({"output": result, "error": None})
