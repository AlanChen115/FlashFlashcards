import { Link } from 'react-router-dom';

function Navbar(){
    return(
        <nav className="navbar">
            <div className="navbar-brand">FlashFlashcards</div>
            <div className="navbar-links">
                <Link to="/generate">Generate</Link>
                <Link to="/library">Library</Link>
            </div>
        </nav>
    );
}

export default Navbar;
