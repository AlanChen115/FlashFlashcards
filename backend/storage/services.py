import hashlib
from .models import Flashcard

def ingest_accepted_flashcards(flashcards, language):
    saved = []
    existing = []

    for card in flashcards:
        front = card.get("front", "")
        back = card.get("back", "")
        # lemma = card.get("lemma", "") --- IGNORE --- for now we don't have lemma, but we can add it later if we want
        lemma = ""
        
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
        "saved": saved,
        "existing": existing,
        "saved_count": len(saved),
        "existing_count": len(existing),
    }