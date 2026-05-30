function resizeTextarea(event) {
  event.target.style.height = 'auto';
  event.target.style.height = `${event.target.scrollHeight}px`;
}

function Flashcard({ card, index, onChange, onDelete }) {
  return (
    <div className="flashcard">
      <div className="flashcard-info">
        <textarea
          value={card.front}
          rows={2}
          onChange={(e) => onChange(index, 'front', e.target.value)}
          onInput={resizeTextarea}
          placeholder="Front of card"
        />
        <textarea
          value={card.back}
          rows={3}
          onChange={(e) => onChange(index, 'back', e.target.value)}
          onInput={resizeTextarea}
          placeholder="Back of card"
        />
        {card.similar && (
          <div className="similar-indicator" tabIndex={0}>
            Similar card found!
            <div className="similar-tooltip" role="tooltip">
              <p className="similar-title">Similar cards:</p>
              {card.similar_cards?.map((similarCard, similarIndex) => (
                <div key={similarIndex} className="similar-item">
                  <strong>{similarCard.front}</strong> - {similarCard.back}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <button className="delete-button" aria-label="Delete flashcard" onClick={() => onDelete(index)}>
        <span className="delete-icon" aria-hidden="true">&times;</span>
      </button>
    </div>
  );
}

export default Flashcard;
