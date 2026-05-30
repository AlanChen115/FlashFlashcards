import hashlib
from ai_generator.lemma import generate_lemma
from .models import Flashcard
from django.db.models import Q
from django.db import IntegrityError



def get_content_hash(front, back):
    return hashlib.sha256(f"{front}:{back}".encode()).hexdigest()


def serialize_flashcard(flashcard):
    return {
        "id": flashcard.id,
        "card_id": flashcard.id,
        "front": flashcard.front,
        "back": flashcard.back,
        "lemma": flashcard.lemma,
        "language": flashcard.language,
    }


def get_card_lemma(card, language):
    lemma = card.get("lemma", "")
    if lemma:
        return lemma

    text = card.get("back", "") or card.get("front", "")
    if not text:
        return ""

    result = generate_lemma(text, language)
    return result.get("output") or ""


def ingest_accepted_flashcards(flashcards, language):
    saved_count = 0
    existing_count = 0
    accepted_flashcards = []

    for card in flashcards:
        front = card.get("front", "")
        back = card.get("back", "")
        lemma = get_card_lemma(card, language)
        content_hash = get_content_hash(front, back)

        obj, created = Flashcard.objects.get_or_create(
            content_hash=content_hash,
            defaults={
                "front": front,
                "back": back,
                "lemma": lemma,
                "language": language,
            }
        )

        if created:
            saved_count += 1
        else:
            existing_count += 1

        accepted_flashcards.append(serialize_flashcard(obj))

    return {
        "flashcards": accepted_flashcards,
        "saved_count": saved_count,
        "existing_count": existing_count,
    }

def similar_check(flashcards, language):
    cards_with_lemmas = []
    for card in flashcards:
        lemma = get_card_lemma(card, language)
        cards_with_lemmas.append({
            **card,
            "lemma": lemma,
        })

    lemmas = [card.get('lemma', '') for card in cards_with_lemmas if card.get('lemma')]
    
    matches = Flashcard.objects.filter(
        lemma__in=lemmas,
        language=language,
    ).values('lemma', 'front', 'back')
   
    grouped = {}
    for card in matches:
        lemma = card.get('lemma', '')
        if lemma not in grouped:
            grouped[lemma] = []
        grouped[lemma].append({
            "front": card.get('front', ''),
            "back": card.get('back', '')
        })

    result = []
    for card in cards_with_lemmas:
        lemma = card.get('lemma', '')
        similar_cards = grouped.get(lemma, [])
        result.append({"front": card.get('front', ''), 
                       "back": card.get('back', ''), 
                       "lemma": lemma,
                       "similar": len(similar_cards) > 0, 
                       "similar_cards": list(similar_cards)
                    })
    return {
        "flashcards": result,
    }

def clear_db():
    deleted_count, _ = Flashcard.objects.all().delete()[0]
    return {"deleted_count": deleted_count}


def remove_flashcard(flashcards, language=None):
    deleted_count = 0

    for card in flashcards:
        card_id = card.get("id") or card.get("card_id") or card.get("cardId")

        if card_id:
            query = Flashcard.objects.filter(id=card_id)
        else:
            front = card.get("front", "")
            back = card.get("back", "")

            if not front and not back:
                continue

            query = Flashcard.objects.filter(content_hash=get_content_hash(front, back))

            if language:
                query = query.filter(language=language)

        deleted, _ = query.delete()
        deleted_count += deleted

    return {"deleted_count": deleted_count}

def get_all_flashcards():
    return [serialize_flashcard(card) for card in Flashcard.objects.all()]

def search_flashcards(query='', language=''):
    found_flashcards = Flashcard.objects.all()
    
    if query:
        found_flashcards = found_flashcards.filter(
            Q(front__icontains=query) |
            Q(back__icontains=query) |
            Q(lemma__icontains=query)
        )
    
    if language:
        found_flashcards = found_flashcards.filter(language=language)

    return {
        "flashcards": [serialize_flashcard(card) for card in found_flashcards]
    }

def get_languages():
    languages = (
        Flashcard.objects
        .exclude(language__isnull=True)
        .exclude(language='')
        .values_list('language', flat=True)
        .distinct()
        .order_by('language')
    )
    return {"languages": list(languages)}

def update_flashcard(card_id, front=None, back=None, lemma=None, language=None):
    try:
        flashcard = Flashcard.objects.get(id=card_id)
    except Flashcard.DoesNotExist:
        return {"flashcard": None, "not_found": True, "duplicate": False}

    if front is not None:
        flashcard.front = front
    if back is not None:
        flashcard.back = back
    if language is not None:
        flashcard.language = language

    old_front = flashcard.front
    old_back = flashcard.back
    old_language = flashcard.language

    if front is not None:
        flashcard.front = front
    if back is not None:
        flashcard.back = back
    if language is not None:
        flashcard.language = language

    text_changed = (
        flashcard.front != old_front or
        flashcard.back != old_back or
        flashcard.language != old_language
    )

    if text_changed:
        flashcard.lemma = get_card_lemma(
            {"front": flashcard.front, "back": flashcard.back},
            flashcard.language,
        )
    elif lemma is not None:
        flashcard.lemma = lemma

    flashcard.content_hash = get_content_hash(flashcard.front, flashcard.back)

    try:
        flashcard.save()
    except IntegrityError:
        return {"flashcard": None, "not_found": False, "duplicate": True}

    return {
        "flashcard": serialize_flashcard(flashcard),
        "not_found": False,
        "duplicate": False,
    }
