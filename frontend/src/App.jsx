import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar';
import CardLibrary from './pages/CardLibrary';
import Generate from './pages/Generate';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Generate />} />
        <Route path="/generate" element={<Generate />} />
        <Route path="/library" element={<CardLibrary />} />
      </Routes>
    </Router>
  );
}

export default App;
