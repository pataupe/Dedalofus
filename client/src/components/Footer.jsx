import { Link } from 'react-router-dom';
import './Footer.css';

const DISCORD_URL = 'https://discord.gg/WDxuStWyh';

function Footer() {
  return (
    <footer className="pied-de-page">
      <div className="pied-de-page__liens">
        <Link to="/cubes">Cubes</Link>
        <Link to="/breloques">Breloques</Link>
        <Link to="/sorts">Sorts</Link>
        <a href={DISCORD_URL} target="_blank" rel="noreferrer">
          Discord
        </a>
        <Link to="/mentions-legales">Mentions légales</Link>
      </div>

      <p className="pied-de-page__disclaimer">Site de fan non affilié à Ankama Games.</p>

      <p className="pied-de-page__copyright">© {new Date().getFullYear()} Dédalofus</p>
      <p className="pied-de-page__credit">Site développé par Pataupe</p>
    </footer>
  );
}

export default Footer;
