import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const TUILES = [
  {
    to: '/cubes',
    nom: 'Cubes',
    compte: '420 pièces',
    couleur: '#a97fdb',
    chemin: 'M12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5Z M12 3 12 12 20 7.5 M12 12 4 7.5 M12 12 12 21',
  },
  {
    to: '/sorts',
    nom: 'Sorts',
    compte: '448 pièces',
    couleur: '#d9534f',
    chemin: 'M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10Z',
  },
  {
    to: '/breloques',
    nom: 'Breloques',
    compte: '166 pièces',
    couleur: '#d4af37',
    chemin: 'M12 3 19 9 12 21 5 9Z',
  },
  {
    to: '/breuvages',
    nom: 'Breuvages',
    compte: '30 pièces',
    couleur: '#4a90d9',
    chemin: 'M9 2h6M10 2v5l-5 9a3 3 0 0 0 3 4h8a3 3 0 0 0 3-4l-5-9V2',
  },
  {
    to: '/ensembles',
    nom: 'Ensembles',
    compte: '29 ensembles',
    couleur: '#7fd1c8',
    chemin: 'M12 2 20 5v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5Z',
  },
  {
    to: '/monstres',
    nom: 'Monstres',
    compte: '84 monstres',
    couleur: '#9b59b6',
    chemin: 'M12 3c4 0 7 3 7 7v8l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5V10c0-4 3-7 7-7Z',
  },
];

function HomePage() {
  const { session } = useAuth();

  return (
    <div className="page-accueil">
      <div className="page-accueil__intro">
        <div className="page-accueil__etiquette">
          <span className="page-accueil__trait" />
          Dofus Touch &middot; Le Dédale
          <span className="page-accueil__trait" />
        </div>
        <h1>Équipe ton stuff pour le Dédale</h1>
        <p>Cubes, sorts, breloques, breuvages : compose ton équipement complet et calcule tes dégâts avant d'entrer dans le donjon.</p>
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

      <div className="page-accueil__contenu">
        <div className="page-accueil__label">Explorer le contenu</div>
        <div className="page-accueil__tuiles">
          {TUILES.map((tuile) => (
            <Link key={tuile.to} to={tuile.to} className="page-accueil__tuile">
              <svg
                width="27"
                height="27"
                viewBox="0 0 24 24"
                fill="none"
                stroke={tuile.couleur}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={tuile.chemin} />
              </svg>
              <span className="page-accueil__tuile-texte">
                <span className="page-accueil__tuile-nom">{tuile.nom}</span>
                <span className="page-accueil__tuile-compte">{tuile.compte}</span>
              </span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#716b78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
