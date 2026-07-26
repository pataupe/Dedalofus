import { Link } from 'react-router-dom';
import './Footer.css';

const DISCORD_URL = 'https://discord.gg/WDxuStWyh';

function Footer() {
  return (
    <footer className="pied-de-page">
      <div className="pied-de-page__colonnes">
        <div className="pied-de-page__colonne">
          <p className="pied-de-page__titre-colonne">Explorer</p>
          <Link to="/cubes">Cubes</Link>
          <Link to="/breloques">Breloques</Link>
          <Link to="/sorts">Sorts</Link>
        </div>

        <div className="pied-de-page__colonne">
          <p className="pied-de-page__titre-colonne">Communauté</p>
          <a href={DISCORD_URL} target="_blank" rel="noreferrer">
            Rejoindre le Discord
          </a>
        </div>

        <div className="pied-de-page__colonne">
          <p className="pied-de-page__titre-colonne">Légal</p>
          <Link to="/mentions-legales">Mentions légales</Link>
          <Link to="/politique-de-confidentialite">Politique de confidentialité</Link>
          <Link to="/conditions-generales-utilisation">CGU</Link>
        </div>
      </div>

      <div className="pied-de-page__bas">
        <p className="pied-de-page__disclaimer">
          Site non affilié à Ankama Games. Dofus Touch et les éléments de jeu mentionnés sont des marques et
          contenus appartenant à Ankama Games.
        </p>
        <div className="pied-de-page__credits">
          <p className="pied-de-page__mention">© {new Date().getFullYear()} Dédalofus</p>
          <p className="pied-de-page__mention">Site développé par Pataupe</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
