import { Link } from 'react-router-dom';
import './Footer.css';

const DISCORD_URL = 'https://discord.gg/WDxuStWyh';

function Footer() {
  return (
    <footer className="pied-de-page">
      <p className="pied-de-page__disclaimer">
        Dédalofus est un site de fan, créé indépendamment et non affilié, associé, autorisé ou soutenu par Ankama
        Games. Dofus Touch est une marque déposée d'Ankama.
      </p>

      <div className="pied-de-page__liens">
        <Link to="/cubes">Cubes</Link>
        <Link to="/breloques">Breloques</Link>
        <Link to="/sorts">Sorts</Link>
        <a href={DISCORD_URL} target="_blank" rel="noreferrer">
          Discord
        </a>
      </div>

      <p className="pied-de-page__copyright">© {new Date().getFullYear()} Dédalofus</p>
    </footer>
  );
}

export default Footer;
