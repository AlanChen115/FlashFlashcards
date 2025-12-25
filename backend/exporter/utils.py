import io
import genanki
import hashlib

def deck_id_from_name(name):
    return int(hashlib.sha1(name.encode()).hexdigest()[:8], 16)

def export_anki(flashcards):
    my_model = genanki.Model(2116387041, 'Simple Model',
        fields=[
            {'name': 'Front'},
            {'name': 'Back'},
        ],
        templates=[
            {
                'name': 'Card 1',
                'qfmt': '{{Front}}',
                'afmt': '{{Back}}',
            },
        ])
    my_deck = genanki.Deck(deck_id_from_name('Sample Deck'), 'Sample Deck')

    for flashcard in flashcards:
        my_deck.add_note(genanki.Note(
            model=my_model,
            fields=[flashcard.get("front", ""), flashcard.get("back", "")],
        ))
        
    # genanki.Package(my_deck).write_to_file('output.apkg')
    # return {"status": "Anki deck exported successfully"}

    # Uncomment below to return as bytes instead of writing to file
    buffer = io.BytesIO()
    genanki.Package(my_deck).write_to_file(buffer)

    return buffer


def export_quizlet(flashcards):
    lines = []
    
    for flashcard in flashcards:
        lines.append(f"{flashcard.get('front', '')}\t{flashcard.get('back', '')}")

    output = "\n".join(lines)

    return output