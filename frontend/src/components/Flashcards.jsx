import { useRef, useState } from 'react';
import { checkSimilarFlashcards } from '../services/api';

function Flashcards({ flashcards, setFlashcards, language }) {
  const debounceRefs = useRef(null);
  const pendingCheckIndexes = useRef(new Set());
  const latestFlashcardsRef = useRef(flashcards);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  latestFlashcardsRef.current = flashcards;

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

    setFlashcards([]);
  };

  return (
    <div className="flashcards-container">
      {flashcards.map((card, index) => (
        <div key={index} className="flashcard">
          <input
            type="text"
            value={card.front}
            onChange={(e) => handleChange(index, 'front', e.target.value)}
          />
          <input
            type="text"
            value={card.back}
            onChange={(e) => handleChange(index, 'back', e.target.value)}
          />
          {card.similar && (
            <div
              className="similar-indicator"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              Similar card found!
              {hoveredIndex === index && (
                <div className="similar-tooltip">
                  <p className="similar-title">Similar cards:</p>
                  {card.similar_cards.map((sim, i) => (
                    <div key={i} className="similar-item">
                      <strong>{sim.front}</strong> - {sim.back}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <button onClick={() => {
            const updatedFlashcards = flashcards.filter((_, i) => i !== index);
            setFlashcards(updatedFlashcards);
          }}>Delete</button>
        </div>
      ))}
      <button onClick={() => {
        const updatedFlashcards = [...flashcards];
        updatedFlashcards.push({ front: '', back: '' });
        setFlashcards(updatedFlashcards);
      }}>Add Flashcard</button>
      <button onClick={handleClearAll}>Clear All</button>
    </div>
  );
}

export default Flashcards;
