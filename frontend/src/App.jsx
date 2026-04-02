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

function LinkField( {onGenerate} ) {
  const [links, setLinks] = useState([''])
  const [language, setLanguage] = useState('Japanese');

  const languageOptions = [{value :'Japanese', label: 'Japanese'}, {value :'Chinese', label: 'Chinese'}];

  function handleChange(event, index) {
    const updatedLinks = [...links];
    updatedLinks[index] = event.target.value;
    setLinks(updatedLinks);
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      let response;
      if (links.length === 0) {
        return alert("Please add at least one link.");
      } 
        
      response = await postJSON('/api/ai_generator/parse_website/', { urls: links, language: language });
      
      console.log("API response:", response);

      const flashcards = []
      for (const website of response.output){
        flashcards.push(...website.flashcards);
      }

      console.log("Generated flashcards:", flashcards);
      onGenerate(flashcards);
    } catch (err) {
      alert("Check console for details.");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Select Language:</label>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        {languageOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
      <button type="submit">Submit</button>
    </form>
  );
}

function FileUpload( {onGenerate} ) {
  const [file, setFile] = useState(null);
  const HandleFileChange = (e) => setFile(e.target.files);
  const handleSubmit = async () => {
    if (!file) return alert("Please select a file first!");
    const formData = new FormData();
    for (let i = 0; i < file.length; i++) {
      formData.append("files", file[i]);
    }
    formData.append("language", "Japanese"); // Hardcoded for now, can add dropdown later

    try {
      const response = await fetch("/api/ai_generator/parse_images/", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      
      const data = await response.json();
      const flashcards = []
      for (const image of data.output){
        flashcards.push(...image.flashcards);
      }

      console.log("Generated flashcards:", flashcards);

      onGenerate(flashcards);
    } catch (err) {
      alert("File upload failed. Check console for details.");
    }
  }
  return(
    <div>
      <input type="file" multiple onChange={HandleFileChange} />
      <button onClick={handleSubmit}>Submit</button>
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
      <LinkField onGenerate={handleGenerate} />
      <FileUpload onGenerate={handleGenerate} />
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
