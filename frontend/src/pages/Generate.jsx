import { useState } from 'react';
import Flashcards from '../components/Flashcards';
import {
  checkSimilarFlashcards,
  commitFlashcards,
  createFileFormData,
  exportFlashcards,
  parseImages,
  parseWebsite,
} from '../services/api';

function LinkField({ links, setLinks }) {
  function handleChange(event, index) {
    const updatedLinks = [...links];
    updatedLinks[index] = event.target.value;
    setLinks(updatedLinks);
  }

  return (
    <div className="link-field">
      {links.map((link, index) => (
        <div key={index} className="link-row">
          <input
            type="text"
            className="link-input"
            value={link}
            onChange={(e) => {
              handleChange(e, index);
            }}
            placeholder="https://example.com"
          />
          <button
            className="delete-button"
            type="button"
            aria-label="Delete link"
            onClick={() => {
              const updatedLinks = links.filter((_, i) => i !== index);
              setLinks(updatedLinks);
            }}
          >
            <span className="delete-icon" aria-hidden="true">×</span>
          </button>
        </div>
      ))}
      <button
        className="add-link-button"
        type="button"
        aria-label="Add link"
        onClick={() => {
          setLinks([...links, '']);
        }}
      >
        <span className="add-link-icon" aria-hidden="true">+</span>
        Add another link
      </button>
    </div>
  );
}

function FileUpload({ setFile }) {
  const handleFileChange = (e) => setFile(e.target.files);

  return (
    <div className="file-upload-wrapper">
      <label className="file-upload-label">
        <input className="file-upload-input" type="file" multiple onChange={handleFileChange} />
        <span>Select images or documents</span>
      </label>
      <p className="upload-help">Upload JPG, PNG, or PDF files. You can select multiple files.</p>
    </div>
  );
}

function UnifiedForm({ onGenerate, language, setLanguage }) {
  const [file, setFile] = useState(null);
  const [links, setLinks] = useState(['']);

  const languageOptions = [
    { value: 'Japanese', label: 'Japanese' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'Korean', label: 'Korean' },
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();

    const hasLinks = links.some((link) => link.trim() !== '');
    const hasFiles = file && file.length > 0;

    if (!hasLinks && !hasFiles) {
      return alert('Please add at least one link or upload at least one file.');
    }

    try {
      const allFlashcards = [];

      if (hasFiles) {
        const formData = createFileFormData(file, { language });
        const fileData = await parseImages(formData);
        for (const image of fileData.output) {
          allFlashcards.push(...image.flashcards);
        }
      }

      if (hasLinks) {
        const linkResponse = await parseWebsite(links, language);

        for (const website of linkResponse.output) {
          allFlashcards.push(...website.flashcards);
        }
      }

      console.log('Generated flashcards:', allFlashcards);
      onGenerate(allFlashcards);
    } catch (err) {
      alert('Check console for details.');
    }
  };

  return (
    <div className="modal-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Select language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Website links</label>
          <LinkField links={links} setLinks={setLinks} />
        </div>

        <div className="form-group">
          <label>Upload files</label>
          <FileUpload setFile={setFile} />
        </div>

        <div className="modal-actions">
          <button type="submit" className="primary-button">Generate Flashcards</button>
        </div>
      </form>
    </div>
  );
}

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
    } catch (err) {
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

      <Flashcards flashcards={flashcards} setFlashcards={setFlashcards} language={language} />
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
