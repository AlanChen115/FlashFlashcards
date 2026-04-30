import { useState } from 'react'
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

function LinkField({links, setLinks, language, setLanguage}) {
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

function UnifiedForm({onGenerate}){
  const [file, setFile] = useState(null);
  const [links, setLinks] = useState([''])
  const [language, setLanguage] = useState('Japanese');

  const languageOptions = [{value :'Japanese', label: 'Japanese'}, {value :'Chinese', label: 'Chinese'}];
  
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
        <LinkField links={links} setLinks={setLinks} language={language} setLanguage={setLanguage} />
        <FileUpload files = {file} setFile={setFile} />
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

function Flashcards({flashcards, setFlashcards}) {
  const handleChange = (index, field, value) => {
    const updatedFlashcards = [...flashcards];
    updatedFlashcards[index][field] = value;
    setFlashcards(updatedFlashcards);
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

  const handleGenerate = (generatedFlashcards) => {
    setFlashcards(generatedFlashcards);
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
      <UnifiedForm onGenerate={handleGenerate} />
      {Flashcards({flashcards, setFlashcards})}
      <button onClick={handleDownload}>Download</button>
      <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
        <option value="anki">Anki (.apkg)</option>
        <option value="quizlet">Quizlet (.csv)</option>
      </select>
    </div>
  );
}

export default App
