import { Link } from 'react-router-dom';

function Navbar(){
    return(
        <nav>
            <Link to="/library">Library</Link>
            <Link to="/generate">Generate</Link>
        </nav>
    );
}

export default Navbar;