import { useState } from 'react';
import FlashcardsContainer from '../components/FlashcardsContainer';
import UnifiedForm from '../components/UnifiedForm';
import {
  clearFlashcardsDatabase,
  commitFlashcards,
} from '../services/api';

function CardLibrary() {
  const [importedFlashcards, setImportedFlashcards] = useState([]);
  const [language, setLanguage] = useState('Japanese');
  const [showForm, setShowForm] = useState(false);

  const handleImport = (cards) => {
    setImportedFlashcards(cards);
    setShowForm(false);
  };

  const handleAccept = async () => {
    if (!importedFlashcards.length) return alert('No imported flashcards to accept.');

    try {
      await commitFlashcards(importedFlashcards, language);
      setImportedFlashcards([]);
    } catch (err) {
      console.error('Error accepting imported cards:', err);
      alert('Import failed. Check console for details.');
    }
  };

  const closeForm = () => setShowForm(false);

  return (
    <div>
      <h1>Card Library</h1>

      <button type="button" className="open-form-button" onClick={() => setShowForm(true)}>
        Import Flashcards
      </button>

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              aria-label="Close form"
              className="modal-close-button"
              onClick={closeForm}
            >
              X
            </button>
            <div className="modal-header">
              <h2>Import flashcards</h2>
              <p>Upload an Anki or CSV file to preview before adding it to your library.</p>
            </div>
            <UnifiedForm
              onGenerate={handleImport}
              language={language}
              setLanguage={setLanguage}
              showLinks={false}
              mode="import"
              submitLabel="Import"
              fileAccept=".apkg,.csv"
              fileHelpText="Upload APKG or CSV files. You can select multiple files."
              fileLabel="Select flashcard files"
            />
          </div>
        </div>
      )}

      <div className="db-section">
        <h2>Imported Flashcards</h2>
        <FlashcardsContainer
          flashcards={importedFlashcards}
          setFlashcards={setImportedFlashcards}
          language={language}
        />
        {importedFlashcards.length > 0 && (
          <button type="button" onClick={handleAccept}>
            Accept Imported Flashcards
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            clearFlashcardsDatabase();
          }}
        >
          Clear Database
        </button>
      </div>
    </div>
  );
}

export default CardLibrary;
