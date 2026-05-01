import hashlib
from .models import Flashcard

def ingest_accepted_flashcards(flashcards, language):
    saved = []
    existing = []

    for card in flashcards:
        front = card.get("front", "")
        back = card.get("back", "")
        lemma = card.get("lemma", "")

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
        "flashcards": flashcards,
        "saved_count": len(saved),
        "existing_count": len(existing),
    }

def similar_check(flashcards):
    lemmas = [card.get('lemma', '') for card in flashcards if card.get('lemma')]
    
    matches = Flashcard.objects.filter(lemma__in=lemmas).values('lemma', 'front', 'back')
   
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
    for card in flashcards:
        lemma = card.get('lemma', '')
        similar_cards = grouped.get(lemma, [])
        result.append({"front": card.get('front', ''), 
                       "back": card.get('back', ''), 
                       "similar": len(similar_cards) > 0, 
                       "similar_cards": list(similar_cards)
                    })
    return {
        "flashcards": result,
    }