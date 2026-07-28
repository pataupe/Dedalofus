import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listerBreloques } from '../api/breloques';
import { equiperBreloqueAuto, equiperBreloque, obtenirPersonnage } from '../api/personnages';
import { useAuth } from '../context/AuthContext';
import { RANGS_MAITRISE } from '../constants/rangsMaitrise';
import { CATEGORIES_BRELOQUES } from '../constants/categoriesBreloques';
import BreloqueCard from '../components/BreloqueCard';
import Toast from '../components/Toast';
import ModaleRemplacement from '../components/ModaleRemplacement';
import './BreloqueListPage.css';

const DUREE_TOAST_MS = 3000;

const PAR_PAGE = 40;

// Rangs filtrables pour les breloques : les 4 rangs de maîtrise (partagés avec
// les sorts, via RANGS_MAITRISE) + "Boss", propre aux breloques (rang réel en
// base "Unique" — le libellé affiché diffère de la valeur envoyée à l'API,
// donc pas question d'ajouter "Unique" à RANGS_MAITRISE qui est aussi utilisée
// par la page Sorts, qui n'a pas ce rang).
const RANGS_BRELOQUES = [...RANGS_MAITRISE.map((rang) => ({ valeur: rang, libelle: rang })), { valeur: 'Unique', libelle: 'Boss' }];

// Plusieurs filtres actifs en même temps (ajoute/retire de la liste).
function basculerMulti(liste, valeur) {
  return liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur];
}

function BreloqueListPage() {
  const [recherche, setRecherche] = useState('');
  const [rangsActifs, setRangsActifs] = useState([]);
  const [categoriesActives, setCategoriesActives] = useState([]);
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [page, setPage] = useState(0);
  const [breloques, setBreloques] = useState([]);
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

  async function equiper(breloqueId) {
    // Venu du bouton "Remplacer" (fiche perso) : cible directement l'emplacement
    // choisi, plutôt que le premier libre.
    if (emplacementCible) {
      try {
        await equiperBreloque(session.token, perso, emplacementCible, breloqueId);
        afficherToast({ texte: 'Équipé !', lien: `/personnage/${perso}` });
      } catch (err) {
        afficherToast({ texte: err.message, erreur: true });
      }
      return;
    }

    try {
      await equiperBreloqueAuto(session.token, perso, breloqueId);
      afficherToast({ texte: 'Équipé !', lien: `/personnage/${perso}` });
    } catch (err) {
      if (err.code === 'COMPLET') {
        try {
          const p = await obtenirPersonnage(session.token, perso);
          setRemplacement({ breloqueId, emplacements: p.breloques });
        } catch {
          afficherToast({ texte: "Impossible de charger l'équipement actuel.", erreur: true });
        }
      } else {
        afficherToast({ texte: err.message, erreur: true });
      }
    }
  }

  async function remplacerBreloque(emplacement) {
    try {
      await equiperBreloque(session.token, perso, emplacement, remplacement.breloqueId);
      setRemplacement(null);
      afficherToast({ texte: 'Équipé !', lien: `/personnage/${perso}` });
    } catch (err) {
      setRemplacement(null);
      afficherToast({ texte: err.message, erreur: true });
    }
  }

  useEffect(() => {
    setPage(0);
  }, [recherche, rangsActifs, categoriesActives]);

  useEffect(() => {
    setChargement(true);
    setErreur(null);

    listerBreloques({
      nom: recherche,
      rangs: rangsActifs,
      tags: categoriesActives,
      limite: PAR_PAGE,
      offset: page * PAR_PAGE,
    })
      .then(setBreloques)
      .catch(() => setErreur('Impossible de charger les breloques. Le serveur est-il lancé ?'))
      .finally(() => setChargement(false));
  }, [recherche, rangsActifs, categoriesActives, page]);

  return (
    <div className="page-breloques">
      <h1>Breloques du Dédale</h1>

      <div className="page-breloques__filtres">
        <input
          type="text"
          placeholder="Rechercher une breloque..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />

        <div className="page-breloques__rangs">
          {RANGS_BRELOQUES.map(({ valeur, libelle }) => (
            <button
              key={valeur}
              className={rangsActifs.includes(valeur) ? 'actif' : ''}
              onClick={() => setRangsActifs((actuels) => basculerMulti(actuels, valeur))}
            >
              {libelle}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="page-breloques__bouton-plus-filtres"
          onClick={() => setFiltresOuverts((o) => !o)}
          aria-expanded={filtresOuverts}
        >
          + de filtres {filtresOuverts ? '▲' : '▼'}
        </button>

        <div className={`page-breloques__plus-filtres ${filtresOuverts ? 'ouvert' : ''}`}>
          <div className="page-breloques__plus-filtres-contenu">
            <p className="page-breloques__categories-note">Filtres par catégorie</p>
            <div className="page-breloques__categories-grille">
              {CATEGORIES_BRELOQUES.map((categorie) => (
                <button
                  key={categorie}
                  className={categoriesActives.includes(categorie) ? 'actif' : ''}
                  onClick={() => setCategoriesActives((actuelles) => basculerMulti(actuelles, categorie))}
                >
                  {categorie}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {erreur && <p className="page-breloques__erreur">{erreur}</p>}
      {chargement && <p>Chargement...</p>}
      {!chargement && !erreur && breloques.length === 0 && <p>Aucune breloque ne correspond à ta recherche.</p>}

      <div className="page-breloques__grille">
        {breloques.map((breloque) => (
          <div key={breloque.id} className="page-breloques__carte">
            <BreloqueCard breloque={breloque} />
            {modeEquipement && (
              <button
                type="button"
                className="page-breloques__bouton-equiper"
                onClick={() => equiper(breloque.id)}
              >
                {emplacementCible ? 'Remplacer' : 'Équiper'}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="page-breloques__pagination">
        <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          ← Page précédente
        </button>
        <span>Page {page + 1}</span>
        <button disabled={breloques.length < PAR_PAGE} onClick={() => setPage((p) => p + 1)}>
          Page suivante →
        </button>
      </div>

      {modeEquipement && (
        <Toast visible={toastVisible} texte={toastContenu.texte} lien={toastContenu.lien} erreur={toastContenu.erreur} />
      )}

      {remplacement && (
        <ModaleRemplacement
          type="breloque"
          emplacements={remplacement.emplacements}
          onChoisir={remplacerBreloque}
          onClose={() => setRemplacement(null)}
        />
      )}
    </div>
  );
}

export default BreloqueListPage;
