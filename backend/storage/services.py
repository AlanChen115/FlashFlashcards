import hashlib
from ai_generator.lemma import generate_lemma
from .models import Flashcard


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
    saved = []
    existing = []
    accepted_flashcards = []

    for card in flashcards:
        front = card.get("front", "")
        back = card.get("back", "")
        lemma = get_card_lemma(card, language)
        accepted_flashcards.append({
            **card,
            "front": front,
            "back": back,
            "lemma": lemma,
        })

        content_hash = hashlib.sha256(
            f"{front}:{back}".encode()
        ).hexdigest()

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
            saved.append(str(obj.id))
        else:
            existing.append(str(obj.id))

    return {
        "flashcards": accepted_flashcards,
        "saved_count": len(saved),
        "existing_count": len(existing),
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
