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
            fields=[flashcard['front'], flashcard['back']],
        ))
        
    genanki.Package(my_deck).write_to_file('output.apkg')

    return {"status": "Anki deck exported successfully"}

def export_quizlet():
    pass