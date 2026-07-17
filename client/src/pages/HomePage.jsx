import { Link } from 'react-router-dom';
import logo from '../assets/logo.webp';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

function HomePage() {
  const { session } = useAuth();

  return (
    <div className="page-accueil">
      <img src={logo} alt="Dédalofus" className="page-accueil__logo" />
      <h1>Dédalofus</h1>
      <p>Prépare ton stuff pour le Dédale de Dofus Touch.</p>

      <div className="page-accueil__boutons">
        <Link to="/cubes" className="page-accueil__bouton">
          Voir les équipements
        </Link>
        <Link
          to={session ? '/personnage' : '/inscription'}
          className="page-accueil__bouton page-accueil__bouton--secondaire"
        >
          Créer mon équipement
        </Link>
      </div>
    </div>
  );
}

export default HomePage;
