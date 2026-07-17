import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.webp';
import { useAuth } from '../context/AuthContext';
import './Header.css';

function Header() {
  const { session, deconnecter } = useAuth();
  const navigate = useNavigate();

  function seDeconnecter() {
    deconnecter();
    navigate('/');
  }

  return (
    <header className="entete">
      <Link to="/" className="entete__logo">
        <img src={logo} alt="Dédalofus" />
        <span>Dédalofus</span>
      </Link>
      <nav className="entete__nav">
        <Link to="/cubes">Cubes</Link>
        <Link to="/breloques">Breloques</Link>
        <Link to="/sorts">Sorts</Link>
        {session ? (
          <>
            <span className="entete__email">{session.utilisateur.email}</span>
            <button className="entete__deconnexion" onClick={seDeconnecter}>
              Déconnexion
            </button>
          </>
        ) : (
          <Link to="/connexion">Connexion</Link>
        )}
      </nav>
    </header>
  );
}

export default Header;
