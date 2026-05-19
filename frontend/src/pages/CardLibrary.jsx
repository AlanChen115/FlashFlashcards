import { useState } from 'react';
import Flashcards from '../components/Flashcards';
import {
  clearFlashcardsDatabase,
  commitFlashcards,
  createFileFormData,
  importFlashcards,
} from '../services/api';

function ImportForm({ onImport, language }) {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please select a file to import.');

    const formData = createFileFormData(file, { language });
    const response = await importFlashcards(formData);

    onImport(response.output.flashcards);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" multiple accept=".apkg,.csv" onChange={handleFileChange} />
        <button type="submit">Import</button>
      </form>
    </div>
  );
}

function ImportField() {
  const [importedFlashcards, setImportedFlashcards] = useState([]);
  const [language, setLanguage] = useState('Japanese');
  const languageOptions = [
    { value: 'Japanese', label: 'Japanese' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'Korean', label: 'Korean' },
  ];

  const handleImport = (cards) => {
    setImportedFlashcards(cards);
  };

  const handleAccept = async () => {
    await commitFlashcards(importedFlashcards, language);
    setImportedFlashcards([]);
  };

  return (
    <div>
      <label>Import Language:</label>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        {languageOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ImportForm onImport={handleImport} language={language} />
      <h2>Imported Flashcards</h2>
      <Flashcards flashcards={importedFlashcards} setFlashcards={setImportedFlashcards} language={language} />
      <button onClick={handleAccept}>Accept Imported Flashcards</button>
    </div>
  );
}

function CardLibrary() {
  return (
    <div>
      <h1>Card Library</h1>
      <div className="db-section">
        <ImportField />
        <button onClick={() => {
          clearFlashcardsDatabase();
        }}>Clear Database</button>
      </div>
    </div>
  );
}

export default CardLibrary;
