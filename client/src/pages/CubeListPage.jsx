import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listerCubes } from '../api/cubes';
import { equiperCubeAuto, equiperCube, obtenirPersonnage } from '../api/personnages';
import { useAuth } from '../context/AuthContext';
import { ELEMENTS } from '../constants/elements';
import { RANGS } from '../constants/rangs';
import { STATS_CUBES } from '../constants/statsCubes';
import CubeCard from '../components/CubeCard';
import Toast from '../components/Toast';
import ModaleRemplacement from '../components/ModaleRemplacement';
import './CubeListPage.css';

const DUREE_TOAST_MS = 3000;

const PAR_PAGE = 24;

// Reclique sur le filtre déjà actif → le décoche (retour à "Tous").
function basculer(valeurActuelle, valeurCliquee) {
  return valeurActuelle === valeurCliquee ? '' : valeurCliquee;
}

function basculerMulti(liste, valeur) {
  return liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur];
}

function CubeListPage() {
  const [recherche, setRecherche] = useState('');
  const [elementActif, setElementActif] = useState('');
  const [rangActif, setRangActif] = useState('');
  const [statsActives, setStatsActives] = useState([]);
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [page, setPage] = useState(0);
  const [cubes, setCubes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [toastContenu, setToastContenu] = useState({ texte: '' });
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeout = useRef(null);
  const [remplacement, setRemplacement] = useState(null);

  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const perso = searchParams.get('perso');
  const emplacementCible = searchParams.get('emplacement');
  const modeEquipement = Boolean(perso && session);

  useEffect(() => () => clearTimeout(toastTimeout.current), []);

  function afficherToast(contenu) {
    setToastContenu(contenu);
    setToastVisible(true);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastVisible(false), DUREE_TOAST_MS);
  }

  async function equiper(cubeId) {
    // Venu du bouton "Remplacer" (fiche perso) : cible directement l'emplacement
    // choisi, plutôt que le premier libre — sinon ça équiperait ailleurs si
    // d'autres emplacements sont libres, au lieu de remplacer celui visé.
    if (emplacementCible) {
      try {
        await equiperCube(session.token, perso, emplacementCible, cubeId);
        afficherToast({ texte: 'Équipé !', lien: `/personnage/${perso}` });
      } catch (err) {
        afficherToast({ texte: err.message, erreur: true });
      }
      return;
    }

    try {
      await equiperCubeAuto(session.token, perso, cubeId);
      afficherToast({ texte: 'Équipé !', lien: `/personnage/${perso}` });
    } catch (err) {
      if (err.code === 'COMPLET') {
        try {
          const p = await obtenirPersonnage(session.token, perso);
          setRemplacement({ cubeId, emplacements: p.cubes });
        } catch {
          afficherToast({ texte: "Impossible de charger l'équipement actuel.", erreur: true });
        }
      } else {
        afficherToast({ texte: err.message, erreur: true });
      }
    }
  }

  async function remplacerCube(emplacement) {
    try {
      await equiperCube(session.token, perso, emplacement, remplacement.cubeId);
      setRemplacement(null);
      afficherToast({ texte: 'Équipé !', lien: `/personnage/${perso}` });
    } catch (err) {
      setRemplacement(null);
      afficherToast({ texte: err.message, erreur: true });
    }
  }

  // On revient à la page 0 dès que la recherche ou un filtre change.
  useEffect(() => {
    setPage(0);
  }, [recherche, elementActif, rangActif, statsActives]);

  useEffect(() => {
    setChargement(true);
    setErreur(null);

    listerCubes({
      nom: recherche,
      element: elementActif,
      rang: rangActif,
      stats: statsActives,
      limite: PAR_PAGE,
      offset: page * PAR_PAGE,
    })
      .then(setCubes)
      .catch(() => setErreur('Impossible de charger les cubes. Le serveur est-il lancé ?'))
      .finally(() => setChargement(false));
  }, [recherche, elementActif, rangActif, statsActives, page]);

  return (
    <div className="page-cubes">
      <h1>Cubes du Dédale</h1>

      <div className="page-cubes__filtres">
        <input
          type="text"
          placeholder="Rechercher un cube..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />

        <div className="page-cubes__elements">
          <button
            className={elementActif === '' ? 'actif' : ''}
            onClick={() => setElementActif('')}
          >
            Tous
          </button>
          {ELEMENTS.map((e) => (
            <button
              key={e.valeur}
              className={elementActif === e.valeur ? 'actif' : ''}
              style={{ '--couleur-bouton': e.couleur }}
              onClick={() => setElementActif((actuel) => basculer(actuel, e.valeur))}
            >
              {e.valeur}
            </button>
          ))}
        </div>

        <div className="page-cubes__rangs">
          {RANGS.map((rang) => (
            <button
              key={rang}
              className={rangActif === rang ? 'actif' : ''}
              onClick={() => setRangActif((actuel) => basculer(actuel, rang))}
            >
              {rang}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="page-cubes__bouton-plus-filtres"
          onClick={() => setFiltresOuverts((o) => !o)}
          aria-expanded={filtresOuverts}
        >
          + de filtres {filtresOuverts ? '▲' : '▼'}
        </button>

        <div className={`page-cubes__plus-filtres ${filtresOuverts ? 'ouvert' : ''}`}>
          <div className="page-cubes__plus-filtres-contenu">
            <div className="page-cubes__stats">
              {STATS_CUBES.map((stat) => (
                <label key={stat.cle} className="page-cubes__stat-case">
                  <input
                    type="checkbox"
                    checked={statsActives.includes(stat.cle)}
                    onChange={() => setStatsActives((actuelles) => basculerMulti(actuelles, stat.cle))}
                  />
                  {stat.libelle}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {erreur && <p className="page-cubes__erreur">{erreur}</p>}
      {chargement && <p>Chargement...</p>}

      {!chargement && !erreur && cubes.length === 0 && <p>Aucun cube ne correspond à ta recherche.</p>}

      <div className="page-cubes__grille">
        {cubes.map((cube) => (
          <div key={cube.id} className="page-cubes__carte">
            <Link to={`/cubes/${cube.id}`}>
              <CubeCard cube={cube} />
            </Link>
            {modeEquipement && (
              <button type="button" className="page-cubes__bouton-equiper" onClick={() => equiper(cube.id)}>
                {emplacementCible ? 'Remplacer' : 'Équiper'}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="page-cubes__pagination">
        <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          ← Page précédente
        </button>
        <span>Page {page + 1}</span>
        <button disabled={cubes.length < PAR_PAGE} onClick={() => setPage((p) => p + 1)}>
          Page suivante →
        </button>
      </div>

      {modeEquipement && (
        <Toast visible={toastVisible} texte={toastContenu.texte} lien={toastContenu.lien} erreur={toastContenu.erreur} />
      )}

      {remplacement && (
        <ModaleRemplacement
          type="cube"
          emplacements={remplacement.emplacements}
          onChoisir={remplacerCube}
          onClose={() => setRemplacement(null)}
        />
      )}
    </div>
  );
}

export default CubeListPage;
