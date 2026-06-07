import { useState } from 'react';
import FlashcardsContainer from '../components/FlashcardsContainer';
import {
  checkSimilarFlashcards,
  commitFlashcards,
  exportFlashcards,
} from '../services/api';
import UnifiedForm from '../components/UnifiedForm';


function DownloadForm({ flashcards, language, exportFormat, setExportFormat, setFlashcards }) {
  const handleDownload = async () => {
    if (!flashcards.length) return alert('No flashcards to download!');

    try {
      const commitResponse = await commitFlashcards(flashcards, language);
      const acceptedFlashcards = commitResponse.output.flashcards;

      setFlashcards([]);

      const blob = await exportFlashcards(acceptedFlashcards, exportFormat);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFormat === 'quizlet' ? 'flashcards.csv' : 'flashcards.apkg';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Check console for details.');
    }
  };

  return (
    <div>
      <button onClick={handleDownload}>Download</button>
      <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
        <option value="anki">Anki (.apkg)</option>
        <option value="quizlet">Quizlet (.csv)</option>
      </select>
    </div>
  );
}

function Generate() {
  const [flashcards, setFlashcards] = useState([]);
  const [exportFormat, setExportFormat] = useState('anki');
  const [language, setLanguage] = useState('Japanese');
  const [showForm, setShowForm] = useState(false);

  const handleGenerate = async (generatedFlashcards) => {
    try {
      const response = await checkSimilarFlashcards(generatedFlashcards, language);
      const checkedFlashcards = response.output.flashcards;
      setFlashcards(checkedFlashcards);
      console.log('Checked flashcards:', checkedFlashcards);
      setShowForm(false);
    } catch (err) {
      console.error('Error checking similar cards:', err);
    }
  };

  const closeForm = () => setShowForm(false);

  return (
    <div>
      <h1>Generate</h1>
      <button type="button" className="open-form-button" onClick={() => setShowForm(true)}>
        Upload Files / Add Links
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
              ×
            </button>
            <div className="modal-header">
              <h2>Import content</h2>
              <p>Upload files or add website links to generate flashcards automatically.</p>
            </div>
            <UnifiedForm onGenerate={handleGenerate} language={language} setLanguage={setLanguage} />
          </div>
        </div>
      )}

      <FlashcardsContainer flashcards={flashcards} setFlashcards={setFlashcards} language={language} />
      {flashcards.length > 0 && (
        <DownloadForm
          flashcards={flashcards}
          language={language}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          setFlashcards={setFlashcards}
        />
      )}
    </div>
  );
}

export default Generate;
