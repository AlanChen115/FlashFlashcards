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
  const [link, setLink] = useState('')
  const [language, setLanguage] = useState('Japanese');

  const languageOptions = [{value :'Japanese', label: 'Japanese'}];

  function handleChange(event) {
    setLink(event.target.value)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const response = await postJSON('/api/scraper/scrape/', { url: link });
      console.log("Scraped data:", response);

      const scraped_data = response;
      const response2 = await postJSON('/api/ai_generator/parse/', {
        body_text: scraped_data.body_text, language: language
      });
      console.log("Generated flashcards:", response2);
      onGenerate(response2.output.flashcards);
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
      <input type="text" value={link} onChange={handleChange} placeholder="Enter link"/>
      <button type="submit">Submit</button>
    </form>
  );
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
