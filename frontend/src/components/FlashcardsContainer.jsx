import { useEffect, useRef, useState } from 'react';
import { checkSimilarFlashcards } from '../services/api';
import Flashcard from './Flashcard';

function FlashcardsContainer({ flashcards, setFlashcards, language }) {
  const nextCardKeyRef = useRef(flashcards.length);
  const debounceRefs = useRef(null);
  const pendingCheckIndexes = useRef(new Set());
  const latestFlashcardsRef = useRef(flashcards);
  const [cardKeys, setCardKeys] = useState(() =>
    flashcards.map((_, index) => `flashcard-${index}`),
  );

  useEffect(() => {
    latestFlashcardsRef.current = flashcards;
  }, [flashcards]);

  useEffect(() => {
    setCardKeys((currentKeys) => {
      if (currentKeys.length === flashcards.length) return currentKeys;

      if (currentKeys.length > flashcards.length) {
        return currentKeys.slice(0, flashcards.length);
      }

      const addedKeys = Array.from({ length: flashcards.length - currentKeys.length }, () => {
        const key = `flashcard-${nextCardKeyRef.current}`;
        nextCardKeyRef.current += 1;
        return key;
      });
      return [...currentKeys, ...addedKeys];
    });
  }, [flashcards.length]);

  useEffect(() => () => {
    if (debounceRefs.current) {
      clearTimeout(debounceRefs.current);
    }
  }, []);

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

    setCardKeys([]);
    setFlashcards([]);
  };

  const handleDelete = (index) => {
    setCardKeys((currentKeys) => currentKeys.filter((_, i) => i !== index));
    setFlashcards((current) => current.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    const nextCardKey = `flashcard-${nextCardKeyRef.current}`;
    nextCardKeyRef.current += 1;
    setCardKeys((currentKeys) => [...currentKeys, nextCardKey]);
    setFlashcards((current) => [...current, { front: '', back: '' }]);
  };

  return (
    <div className="flashcards-container">
      <div className="flashcards-grid">
        {flashcards.map((card, index) => (
          <Flashcard
            key={cardKeys[index] ?? `flashcard-fallback-${index}`}
            card={card}
            index={index}
            onChange={handleChange}
            onDelete={handleDelete}
          />
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

export default FlashcardsContainer;
