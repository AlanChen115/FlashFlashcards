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
    <div>
      {links.map((link, index) => (
        <div key={index}>
          <input
            type="text"
            value={link}
            onChange={(e) => {
              handleChange(e, index);
            }}
            placeholder="Enter link"
          />
          <button className="delete-button" type="button" aria-label="Delete link" onClick={() => {
            const updatedLinks = links.filter((_, i) => i !== index);
            setLinks(updatedLinks);
          }}>
            <span className="delete-icon" aria-hidden="true">×</span>
          </button>
        </div>
      ))}
      <button className="add-link-button" type="button" aria-label="Add link" onClick={() => {
        setLinks([...links, '']);
      }}>
        <span className="add-link-icon" aria-hidden="true">+</span>
      </button>
    </div>
  );
}

function FileUpload({ setFile }) {
  const handleFileChange = (e) => setFile(e.target.files);

  return (
    <input type="file" multiple onChange={handleFileChange} />
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
    <div>
      <form onSubmit={handleSubmit}>
        <label>Select Language:</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <LinkField links={links} setLinks={setLinks} />
        <FileUpload setFile={setFile} />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

function Generate() {
  const [flashcards, setFlashcards] = useState([]);
  const [exportFormat, setExportFormat] = useState('anki');
  const [language, setLanguage] = useState('Japanese');

  const handleGenerate = async (generatedFlashcards) => {
    try {
      const response = await checkSimilarFlashcards(generatedFlashcards, language);
      const checkedFlashcards = response.output.flashcards;
      setFlashcards(checkedFlashcards);
      console.log('Checked flashcards:', checkedFlashcards);
    } catch (err) {
      console.error('Error checking similar cards:', err);
    }
  };

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
      <h1>Generate</h1>
      <UnifiedForm onGenerate={handleGenerate} language={language} setLanguage={setLanguage} />
      <Flashcards flashcards={flashcards} setFlashcards={setFlashcards} language={language} />
      <button onClick={handleDownload}>Download</button>
      <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
        <option value="anki">Anki (.apkg)</option>
        <option value="quizlet">Quizlet (.csv)</option>
      </select>
    </div>
  );
}

export default Generate;
