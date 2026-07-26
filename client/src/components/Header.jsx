import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.webp';
import { useAuth } from '../context/AuthContext';
import './Header.css';

function Header() {
  const { session, deconnecter } = useAuth();
  const navigate = useNavigate();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [menuItemsOuvert, setMenuItemsOuvert] = useState(false);
  const selecteurRef = useRef(null);

  function seDeconnecter() {
    setMenuOuvert(false);
    deconnecter();
    navigate('/');
  }

  function fermerMenu() {
    setMenuOuvert(false);
    setMenuItemsOuvert(false);
  }

  // Ferme le menu "Liste des items" au clic en dehors de son conteneur (le
  // clic sur le déclencheur lui-même reste géré par son propre onClick).
  useEffect(() => {
    if (!menuItemsOuvert) return;

    function surClicExterieur(e) {
      if (selecteurRef.current && !selecteurRef.current.contains(e.target)) {
        setMenuItemsOuvert(false);
      }
    }

    document.addEventListener('mousedown', surClicExterieur);
    return () => document.removeEventListener('mousedown', surClicExterieur);
  }, [menuItemsOuvert]);

  return (
    <header className="entete">
      <div className="entete__barre">
        <Link to="/" className="entete__logo" onClick={fermerMenu}>
          <img src={logo} alt="Dédalofus" />
          <span>
            Dédalofus <span className="entete__beta">– Bêta</span>
          </span>
        </Link>
        <button
          type="button"
          className={`entete__hamburger ${menuOuvert ? 'entete__hamburger--ouvert' : ''}`}
          aria-label="Ouvrir le menu"
          aria-expanded={menuOuvert}
          onClick={() => setMenuOuvert((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <nav className={`entete__nav ${menuOuvert ? 'entete__nav--ouvert' : ''}`}>
        <div className="entete__liens">
          {/* Regroupe Cubes/Breloques/Sorts (+ Breuvages à venir) derrière un seul
              déclencheur : laisse de la place dans le header pour du contenu futur
              (guides, news, tutos) sans multiplier les boutons de premier niveau. */}
          <div className="entete__items-selecteur" ref={selecteurRef}>
            <button
              type="button"
              className="entete__items-declencheur"
              onClick={() => setMenuItemsOuvert((o) => !o)}
              aria-expanded={menuItemsOuvert}
            >
              <span>Liste des items</span>
              <span className={`entete__items-fleche ${menuItemsOuvert ? 'entete__items-fleche--ouvert' : ''}`}>
                ▾
              </span>
            </button>
            {menuItemsOuvert && (
              <ul className="entete__items-menu">
                <li>
                  <Link to="/cubes" onClick={fermerMenu}>
                    Cubes
                  </Link>
                </li>
                <li>
                  <Link to="/breloques" onClick={fermerMenu}>
                    Breloques
                  </Link>
                </li>
                <li>
                  <Link to="/sorts" onClick={fermerMenu}>
                    Sorts
                  </Link>
                </li>
                <li>
                  <span className="entete__items-bientot">Breuvages (bientôt)</span>
                </li>
              </ul>
            )}
          </div>
          {session && (
            <Link to="/personnage" className="entete__lien entete__lien--compte" onClick={fermerMenu}>
              Mes stuffs
            </Link>
          )}
        </div>
        {session ? (
          <div className="entete__compte">
            <span className="entete__pseudo">{session.utilisateur.pseudo}</span>
            <button className="entete__deconnexion" onClick={seDeconnecter}>
              Déconnexion
            </button>
          </div>
        ) : (
          <Link to="/connexion" className="entete__connexion" onClick={fermerMenu}>
            Connexion
          </Link>
        )}
      </nav>
    </header>
  );
}

export default Header;
