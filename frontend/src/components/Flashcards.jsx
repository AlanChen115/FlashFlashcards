import { useRef } from 'react';
import { checkSimilarFlashcards } from '../services/api';

function Flashcards({ flashcards, setFlashcards, language }) {
  const nextCardKeyRef = useRef(0);
  const cardKeysRef = useRef([]);
  const debounceRefs = useRef(null);
  const pendingCheckIndexes = useRef(new Set());
  const latestFlashcardsRef = useRef(flashcards);

  latestFlashcardsRef.current = flashcards;

  while (cardKeysRef.current.length < flashcards.length) {
    cardKeysRef.current.push(`flashcard-${nextCardKeyRef.current}`);
    nextCardKeyRef.current += 1;
  }

  if (cardKeysRef.current.length > flashcards.length) {
    cardKeysRef.current.length = flashcards.length;
  }

  const handleChange = (index, field, value) => {
    pendingCheckIndexes.current.add(index);
    setFlashcards((current) => {
      const updatedFlashcards = [...current];
      updatedFlashcards[index] = {
        ...updatedFlashcards[index],
        [field]: value,
        ...(field === 'back' ? { lemma: '' } : {}),
      };
      latestFlashcardsRef.current = updatedFlashcards;
      return updatedFlashcards;
    });

    if (debounceRefs.current) {
      clearTimeout(debounceRefs.current);
    }
    debounceRefs.current = setTimeout(() => {
      checkSimilarCards(latestFlashcardsRef.current);
    }, 400);
  };

  const checkSimilarCards = async (latestFlashcards) => {
    const indexes = Array.from(pendingCheckIndexes.current);
    pendingCheckIndexes.current.clear();
    debounceRefs.current = null;

    const cardsToCheck = indexes.map((i) => latestFlashcards[i]);

    if (!cardsToCheck.length) return;

    try {
      const response = await checkSimilarFlashcards(cardsToCheck, language);
      const checkedFlashcards = response.output.flashcards;

      setFlashcards((current) => {
        const updatedFlashcards = [...current];
        checkedFlashcards.forEach((returnedCard, i) => {
          const originalIndex = indexes[i];
          updatedFlashcards[originalIndex] = {
            ...updatedFlashcards[originalIndex],
            lemma: returnedCard.lemma,
            similar: returnedCard.similar,
            similar_cards: returnedCard.similar_cards,
          };
        });

        return updatedFlashcards;
      });
    } catch (error) {
      console.error('Error checking similar cards:', error);
    }
  };

  const handleClearAll = () => {
    if (!flashcards.length) return;

    const shouldClear = window.confirm('Clear all flashcards?');
    if (!shouldClear) return;

    cardKeysRef.current = [];
    setFlashcards([]);
  };

  const handleDelete = (index) => {
    cardKeysRef.current.splice(index, 1);
    setFlashcards((current) => current.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    cardKeysRef.current.push(`flashcard-${nextCardKeyRef.current}`);
    nextCardKeyRef.current += 1;
    setFlashcards((current) => [...current, { front: '', back: '' }]);
  };

  return (
    <div className="flashcards-container">
      <div className="flashcards-grid">
        {flashcards.map((card, index) => (
          <div key={cardKeysRef.current[index]} className="flashcard">
            <div className="flashcard-info">
              <textarea
                value={card.front}
                rows={2}
                onChange={(e) => handleChange(index, 'front', e.target.value)}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder="Front of card"
              />
              <textarea
                value={card.back}
                rows={3}
                onChange={(e) => handleChange(index, 'back', e.target.value)}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder="Back of card"
              />
              {card.similar && (
                <div className="similar-indicator" tabIndex={0}>
                  Similar card found!
                  <div className="similar-tooltip" role="tooltip">
                    <p className="similar-title">Similar cards:</p>
                    {card.similar_cards?.map((sim, i) => (
                      <div key={i} className="similar-item">
                        <strong>{sim.front}</strong> - {sim.back}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="delete-button" aria-label="Delete flashcard" onClick={() => handleDelete(index)}>
              <span className="delete-icon" aria-hidden="true">×</span>
            </button>
          </div>
        ))}
        <button className="flashcard-add-card" type="button" aria-label="Add flashcard" onClick={handleAdd}>
          <span className="add-flashcard-icon" aria-hidden="true">+</span>
          <span>Add card</span>
        </button>
      </div>
      {flashcards.length > 0 && (
        <button className="clear-all-button" onClick={handleClearAll}>Clear All</button>
      )}
    </div>
  );
}

export default Flashcards;
