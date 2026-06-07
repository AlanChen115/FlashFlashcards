import { useState, useRef } from 'react';
import {
  createFileFormData,
  importFlashcards,
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

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileUpload({
  file,
  setFile,
  accept = '.jpg,.jpeg,.png,.pdf',
  helpText = 'Upload JPG, PNG, or PDF files. You can select multiple files.',
  label = 'Select images or documents',
}) {
  const inputRef = useRef(null);
  const selectedFiles = file ? Array.from(file) : [];
  const handleFileChange = (e) => setFile(e.target.files);

  const handleRemoveFile = (fileIndex) => {
    const updatedFiles = selectedFiles.filter((_, index) => index !== fileIndex);

    if (!updatedFiles.length) {
      if (inputRef.current) inputRef.current.value = '';
      setFile(null);
      return;
    }

    const dataTransfer = new DataTransfer();
    updatedFiles.forEach((selectedFile) => dataTransfer.items.add(selectedFile));

    if (inputRef.current) inputRef.current.files = dataTransfer.files;
    setFile(dataTransfer.files);
  };

  return (
    <div className="file-upload-wrapper">
      <label className="file-upload-label">
        <input
          ref={inputRef}
          className="file-upload-input"
          type="file"
          multiple
          accept={accept}
          onChange={handleFileChange}
        />
        <span>{label}</span>
      </label>
      <p className="upload-help">{helpText}</p>
      {selectedFiles.length > 0 && (
        <div className="selected-files" aria-live="polite">
          <p className="selected-files-title">
            Selected {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}
          </p>
          <ul className="selected-files-list">
            {selectedFiles.map((selectedFile, index) => (
              <li key={`${selectedFile.name}-${selectedFile.lastModified}`} className="selected-file">
                <span className="selected-file-details">
                  <span className="selected-file-name">{selectedFile.name}</span>
                  <span className="selected-file-size">{formatFileSize(selectedFile.size)}</span>
                </span>
                <button
                  className="selected-file-remove"
                  type="button"
                  aria-label={`Remove ${selectedFile.name}`}
                  onClick={() => handleRemoveFile(index)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function UnifiedForm({
  onGenerate,
  language,
  setLanguage,
  showLinks = true,
  mode = 'generate',
  submitLabel = 'Generate Flashcards',
  fileAccept = '.jpg,.jpeg,.png,.pdf',
  fileHelpText = 'Upload JPG, PNG, or PDF files. You can select multiple files.',
  fileLabel = 'Select images or documents',
}) {
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

    const hasLinks = showLinks && links.some((link) => link.trim() !== '');
    const hasFiles = file && file.length > 0;

    if (!hasLinks && !hasFiles) {
      return alert(showLinks
        ? 'Please add at least one link or upload at least one file.'
        : 'Please upload at least one file.');
    }

    try {
      if (mode === 'import') {
        const formData = createFileFormData(file, { language });
        const response = await importFlashcards(formData);
        onGenerate(response.output.flashcards);
        return;
      }

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
    } catch {
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

        {showLinks && (
          <div className="form-group">
            <label>Website links</label>
            <LinkField links={links} setLinks={setLinks} />
          </div>
        )}

        <div className="form-group">
          <label>Upload files</label>
          <FileUpload
            file={file}
            setFile={setFile}
            accept={fileAccept}
            helpText={fileHelpText}
            label={fileLabel}
          />
        </div>

        <div className="modal-actions">
          <button type="submit" className="primary-button">{submitLabel}</button>
        </div>
      </form>
    </div>
  );
}

export default UnifiedForm;
