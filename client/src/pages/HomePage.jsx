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
      <p>Simulateur de stuff pour le Dédale de Dofus Touch.</p>
      <p>Équipe tes cubes, breloques et sorts, calcule tes dégâts.</p>

      <div className="page-accueil__boutons">
        <Link
          to={session ? '/personnage' : '/inscription'}
          className="page-accueil__bouton page-accueil__bouton--principal"
        >
          Créer mon équipement
        </Link>
        {session && (
          <Link to="/personnage" className="page-accueil__bouton page-accueil__bouton--secondaire">
            Voir mes équipements
          </Link>
        )}
      </div>
    </div>
  );
}

export default HomePage;
