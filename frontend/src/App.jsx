import { useState, useRef } from 'react'
import './App.css'

async function postJSON(url, body) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

function createFileFormData(files, fields = {}) {
  const formData = new FormData();

  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }

  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return formData;
}

async function postFormData(url, formData) {
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return await response.json();
}

function LinkField({links, setLinks}) {
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
          <button type="button" onClick={() => {
            const updatedLinks = links.filter((_, i) => i !== index);
            setLinks(updatedLinks);
          }}>Delete</button>
        </div>
      ))}
      <button type="button" onClick={() => {
        setLinks([...links, '']);
      }}>Add Link</button>
    </div>
  );
}

function FileUpload({file, setFile}) {
    const handleFileChange = (e) => setFile(e.target.files);
  return(
      <input type="file" multiple onChange={handleFileChange} />
  )
}

function UnifiedForm({onGenerate, language, setLanguage}){
  const [file, setFile] = useState(null);
  const [links, setLinks] = useState([''])

  const languageOptions = [{value :'Japanese', label: 'Japanese'}, {value :'Chinese', label: 'Chinese'}, 
                            {value :'Spanish', label: 'Spanish'}, {value :'Korean', label: 'Korean'}];
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const hasLinks = links.some(link => link.trim() !== '');
    const hasFiles = file && file.length > 0;
    
    if (!hasLinks && !hasFiles) {
      return alert("Please add at least one link or upload at least one file.");
    }

    try {
      const allFlashcards = [];
      
      // Handle file uploads
      if (hasFiles) {
        const formData = createFileFormData(file, { language });
        const fileData = await postFormData("/api/ai_generator/parse_images/", formData);
        for (const image of fileData.output) {
          allFlashcards.push(...image.flashcards);
        }
      }
      
      // Handle link submissions
      if (hasLinks) {
        const linkResponse = await postJSON('/api/ai_generator/parse_website/', { 
          urls: links, 
          language: language 
        });
        
        for (const website of linkResponse.output) {
          allFlashcards.push(...website.flashcards);
        }
      }

      console.log("Generated flashcards:", allFlashcards);
      onGenerate(allFlashcards);
    } catch (err) {
      alert("Check console for details.");
    }
  }
  
  return(
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
        <FileUpload files = {file} setFile={setFile} />
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

function Flashcards({flashcards, setFlashcards, language}) {
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
        ...(field === "back" ? { lemma: "" } : {}),
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
  }

  const checkSimilarCards = async (latestFlashcards) => {
    const indexes = Array.from(pendingCheckIndexes.current);
    pendingCheckIndexes.current.clear();
    debounceRefs.current = null;

    const cardsToCheck = indexes.map(i => latestFlashcards[i]);

    if (!cardsToCheck.length) return; // no cards to check
    
    try {
      const response = await postJSON('/api/storage/similar/', { flashcards: cardsToCheck, language });
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
          }
        });

        return updatedFlashcards;
      })


    } catch (error) {
      console.error("Error checking similar cards:", error);
    }
  };

  const handleClearAll = () => {
    if (!flashcards.length) return;

    const shouldClear = window.confirm("Clear all flashcards?");
    if (!shouldClear) return;

    setFlashcards([]);
  }

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
              ⚠️ Similar card found!
              {hoveredIndex === index && (
                <div className="similar-tooltip">
                  <p className="similar-title">Similar cards:</p>
                  {card.similar_cards.map((sim, i) => (
                    <div key={i} className="similar-item">
                      <strong>{sim.front}</strong> → {sim.back}
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

function ImportForm({ onImport , language, setLanguage}) {
  const [file, setFile] = useState(null);
  const handleFileChange = (e) => {
    setFile(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file to import.");
  
    const formData = createFileFormData(file, { language });

    const response = await postFormData("/api/storage/import/", formData);

    onImport(response.output.flashcards)
  };
  return(
    // idk if other flashcard formats will need to be supported for now only anki and quizlet(csv).
    <div>
      <form onSubmit = {handleSubmit}>
        <input type="file" multiple accept=".apkg,.csv" onChange={handleFileChange} />
        <button type="submit">Import</button>
      </form>
    </div>
  )
}

function ImportField() {
    const [importedFlashcards, setImportedFlashcards] = useState([]);
    const [language, setLanguage] = useState("Japanese");
    const languageOptions = [{value :'Japanese', label: 'Japanese'}, {value :'Chinese', label: 'Chinese'}, 
                            {value :'Spanish', label: 'Spanish'}, {value :'Korean', label: 'Korean'}];

    const handleImport = (cards) => {
      setImportedFlashcards(cards);
    };

    const handleAccept = async () => {
      await postJSON("/api/storage/commit/", {flashcards: importedFlashcards, language: language});
      setImportedFlashcards([]);
    }

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
      <ImportForm onImport={handleImport} language={language} setLanguage={setLanguage} />
      <h2>Imported Flashcards</h2>
      <Flashcards flashcards={importedFlashcards} setFlashcards={setImportedFlashcards} language={language} />
      <button onClick={handleAccept}>Accept Imported Flashcards</button>
    </div>
  )
}

function App() { 
  const [flashcards, setFlashcards] = useState([]);
  const [exportFormat, setExportFormat] = useState('');
  const [language, setLanguage] = useState('Japanese');

  const handleGenerate = async (generatedFlashcards) => {
    try {
      const response = await postJSON('/api/storage/similar/', { flashcards: generatedFlashcards, language });
      const checkedFlashcards = response.output.flashcards;
      setFlashcards(checkedFlashcards);
      console.log("Checked flashcards:", checkedFlashcards);
    } catch (err) {
      console.error("Error checking similar cards:", err);
    }
  }

  const handleDownload = async () => {
    if (!flashcards.length) return alert("No flashcards to download!");

    try {
      const commitResponse = await postJSON("/api/storage/commit/", {flashcards: flashcards, language: language});
      const acceptedFlashcards = commitResponse.output.flashcards;

      const response = await fetch("/api/exporter/"+ exportFormat + "/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcards: acceptedFlashcards }),
      });

      setFlashcards([]); // Clear flashcards after export

      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      // Get file data as a blob
      const blob = await response.blob();

      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "flashcards.apkg"; // Matches your backend filename
      a.click();
      URL.revokeObjectURL(url);
      } catch (err) {
        alert("Export failed. Check console for details.");
      }

    }

  return (
    <div>
      <div>
        <UnifiedForm onGenerate={handleGenerate} language={language} setLanguage={setLanguage} />
        <Flashcards flashcards={flashcards} setFlashcards={setFlashcards} language={language} />
        <button onClick={handleDownload}>Download</button>
        <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
          <option value="anki">Anki (.apkg)</option>
          <option value="quizlet">Quizlet (.csv)</option>
        </select>
      </div>
      <div class="db-section">
        <ImportField/>
        <button onClick={() => {
          postJSON("/api/storage/clear/", {});
        }}>Clear Database</button>
      </div>
    </div>
  );
}

export default App
