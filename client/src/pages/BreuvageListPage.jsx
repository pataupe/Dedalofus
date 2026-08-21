import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listerBreuvages } from '../api/breuvages';
import { equiperBreuvageAuto, equiperBreuvage, obtenirPersonnage } from '../api/personnages';
import { useAuth } from '../context/AuthContext';
import { RANGS_BREUVAGES } from '../constants/rangsBreuvages';
import BreuvageCard from '../components/BreuvageCard';
import Toast from '../components/Toast';
import ModaleRemplacement from '../components/ModaleRemplacement';
import LienRetourFiche from '../components/LienRetourFiche';
import './BreuvageListPage.css';

const DUREE_TOAST_MS = 3000;

// Plusieurs filtres de rang actifs en même temps (ajoute/retire de la liste),
// même convention que Breloques/Sorts.
function basculerMulti(liste, valeur) {
  return liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur];
}

function BreuvageListPage() {
  const [recherche, setRecherche] = useState('');
  const [rangsActifs, setRangsActifs] = useState([]);
  const [breuvages, setBreuvages] = useState([]);
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

  async function equiper(breuvageId) {
    // Venu du bouton "Remplacer" (fiche perso) : cible directement l'emplacement
    // choisi, plutôt que le premier libre (même principe que Cubes/Sorts/Breloques).
    if (emplacementCible) {
      try {
        await equiperBreuvage(session.token, perso, emplacementCible, breuvageId);
        afficherToast({ texte: 'Équipé !', lien: `/personnage/${perso}` });
      } catch (err) {
        afficherToast({ texte: err.message, erreur: true });
      }
      return;
    }

    try {
      await equiperBreuvageAuto(session.token, perso, breuvageId);
      afficherToast({ texte: 'Équipé !', lien: `/personnage/${perso}` });
    } catch (err) {
      if (err.code === 'COMPLET') {
        try {
          const p = await obtenirPersonnage(session.token, perso);
          setRemplacement({ breuvageId, emplacements: p.breuvages });
        } catch {
          afficherToast({ texte: "Impossible de charger l'équipement actuel.", erreur: true });
        }
      } else {
        afficherToast({ texte: err.message, erreur: true });
      }
    }
  }

  async function remplacerBreuvage(emplacement) {
    try {
      await equiperBreuvage(session.token, perso, emplacement, remplacement.breuvageId);
      setRemplacement(null);
      afficherToast({ texte: 'Équipé !', lien: `/personnage/${perso}` });
    } catch (err) {
      setRemplacement(null);
      afficherToast({ texte: err.message, erreur: true });
    }
  }

  useEffect(() => {
    setChargement(true);
    setErreur(null);

    listerBreuvages({ nom: recherche, rangs: rangsActifs, limite: 40 })
      .then(setBreuvages)
      .catch(() => setErreur('Impossible de charger les breuvages. Le serveur est-il lancé ?'))
      .finally(() => setChargement(false));
  }, [recherche, rangsActifs]);

  return (
    <div className="page-breuvages">
      <LienRetourFiche perso={perso} visible={modeEquipement} />
      <h1>Breuvages du Dédale</h1>

      <div className="page-breuvages__filtres">
        <input
          type="text"
          placeholder="Rechercher un breuvage..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />

        <div className="page-breuvages__rangs">
          {RANGS_BREUVAGES.map((rang) => (
            <button
              key={rang}
              className={rangsActifs.includes(rang) ? 'actif' : ''}
              onClick={() => setRangsActifs((actuels) => basculerMulti(actuels, rang))}
            >
              {rang}
            </button>
          ))}
        </div>
      </div>

      {erreur && <p className="page-breuvages__erreur">{erreur}</p>}
      {chargement && <p>Chargement...</p>}
      {!chargement && !erreur && breuvages.length === 0 && <p>Aucun breuvage ne correspond à ta recherche.</p>}

      <div className="page-breuvages__grille">
        {breuvages.map((breuvage) => (
          <div key={breuvage.id} className="page-breuvages__carte">
            <BreuvageCard breuvage={breuvage} />
            {modeEquipement && (
              <button type="button" className="page-breuvages__bouton-equiper" onClick={() => equiper(breuvage.id)}>
                {emplacementCible ? 'Remplacer' : 'Équiper'}
              </button>
            )}
          </div>
        ))}
      </div>

      {modeEquipement && (
        <Toast visible={toastVisible} texte={toastContenu.texte} lien={toastContenu.lien} erreur={toastContenu.erreur} />
      )}

      {remplacement && (
        <ModaleRemplacement
          type="breuvage"
          emplacements={remplacement.emplacements}
          onChoisir={remplacerBreuvage}
          onClose={() => setRemplacement(null)}
        />
      )}
    </div>
  );
}

export default BreuvageListPage;
