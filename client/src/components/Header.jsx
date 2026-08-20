import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.webp';
import monstresData from '../data/monstres.json';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const PROFONDEURS_MONSTRES = monstresData.map(({ cle, titre }) => ({ cle, titre }));

function Header() {
  const { session, deconnecter } = useAuth();
  const navigate = useNavigate();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [menuItemsOuvert, setMenuItemsOuvert] = useState(false);
  const [menuProfondeursOuvert, setMenuProfondeursOuvert] = useState(false);
  const selecteurRef = useRef(null);
  const monstresRef = useRef(null);

  function seDeconnecter() {
    setMenuOuvert(false);
    deconnecter();
    navigate('/');
  }

  function fermerMenu() {
    setMenuOuvert(false);
    setMenuItemsOuvert(false);
    setMenuProfondeursOuvert(false);
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

  // Même logique pour le menu "profondeur" du bouton "Liste des monstres".
  useEffect(() => {
    if (!menuProfondeursOuvert) return;

    function surClicExterieur(e) {
      if (monstresRef.current && !monstresRef.current.contains(e.target)) {
        setMenuProfondeursOuvert(false);
      }
    }

    document.addEventListener('mousedown', surClicExterieur);
    return () => document.removeEventListener('mousedown', surClicExterieur);
  }, [menuProfondeursOuvert]);

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
          {session && (
            <Link to="/personnage" className="entete__lien entete__lien--compte" onClick={fermerMenu}>
              Mes stuffs
            </Link>
          )}
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

          <Link to="/ensembles" className="entete__ensembles-lien" onClick={fermerMenu}>
            Liste des ensembles
          </Link>

          {/* Bouton composé : la zone principale mène directement à la liste
              complète (le geste le plus courant), la petite flèche ouvre un
              menu pour sauter droit sur une profondeur précise sans repasser
              par les filtres de la page. */}
          <div className="entete__monstres" ref={monstresRef}>
            <Link to="/monstres" className="entete__monstres-lien" onClick={fermerMenu}>
              Liste des monstres
            </Link>
            <button
              type="button"
              className="entete__monstres-fleche"
              aria-label="Choisir une profondeur"
              aria-expanded={menuProfondeursOuvert}
              onClick={() => setMenuProfondeursOuvert((o) => !o)}
            >
              ▾
            </button>
            {menuProfondeursOuvert && (
              <ul className="entete__monstres-menu">
                {PROFONDEURS_MONSTRES.map(({ cle, titre }) => (
                  <li key={cle}>
                    <Link to={`/monstres?profondeur=${cle}`} onClick={fermerMenu}>
                      {titre}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
