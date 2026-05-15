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
    const HandleFileChange = (e) => setFile(e.target.files);
  return(
    <div>
      <input type="file" multiple onChange={HandleFileChange} />
    </div>
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
        const formData = new FormData();
        for (let i = 0; i < file.length; i++) {
          formData.append("files", file[i]);
        }
        formData.append("language", language);

        const fileResponse = await fetch("/api/ai_generator/parse_images/", {
          method: "POST",
          body: formData,
        });
        if (!fileResponse.ok) throw new Error(`File request failed: ${fileResponse.status}`);
        
        const fileData = await fileResponse.json();
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
      
      setFlashcards((current) => {
        const updatedFlashcards = [...current];
        response.flashcards.forEach((returnedCard, i) => {
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
    </div>
  );
}

function App() { 
  const [flashcards, setFlashcards] = useState([]);
  const [exportFormat, setExportFormat] = useState('');
  const [language, setLanguage] = useState('Japanese');

  const handleGenerate = async (generatedFlashcards) => {
    try {
      const response = await postJSON('/api/storage/similar/', { flashcards: generatedFlashcards, language });
        setFlashcards(response.flashcards);
      console.log("Checked flashcards:", response.flashcards);
    } catch (err) {
      console.error("Error checking similar cards:", err);
    }
  }

const handleDownload = async () => {
  if (!flashcards.length) return alert("No flashcards to download!");

  try {
    const response = await fetch("/api/exporter/"+ exportFormat + "/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flashcards }),
    });

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

export default App
