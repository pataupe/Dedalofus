import { useEffect, useState } from 'react';
import { ICONES_ENSEMBLES } from '../constants/iconesEnsembles';
import IconeStat from './IconeStat';
import './PanopliesPersonnage.css';

// Même ordre que dans compterCubesParFamille (server/logic/calcul.js), sert juste
// à départager deux familles à égalité de nombre de cubes.
const ORDRE_FAMILLES = ['Air', 'Feu', 'Terre', 'Eau', 'Lumière'];

// Icône/couleur/libellé abrégé (ex: "Do Air", pas "Dommages Air") depuis le même
// référentiel partagé que BonusPalier.jsx/EnsemblesPersonnage.jsx (constants/
// iconesEnsembles.js) — avant, ce composant utilisait STATS_CUBES (libellés
// complets pensés pour les filtres de /cubes, pas pour tenir sur 2 colonnes en
// mobile) via une copie séparée, d'où des libellés tronqués ("Dommages...").
// Repli générique si une stat de PANOPLIES n'a pas encore d'entrée, comme
// BonusPalier.jsx.
function configStat(cle) {
  return ICONES_ENSEMBLES[cle] || { icone: 'losange', couleur: 'var(--texte-attenue)', libelle: cle };
}

// Famille affichée par défaut : celle avec le plus de cubes comptés (Chaos inclus).
function meilleureFamille(panoplies) {
  return [...panoplies].sort((a, b) => {
    if (b.nombre !== a.nombre) return b.nombre - a.nombre;
    return ORDRE_FAMILLES.indexOf(a.famille) - ORDRE_FAMILLES.indexOf(b.famille);
  })[0]?.famille;
}

// Somme les bonus de toutes les familles actives, stat par stat (pour l'option
// "Cumuler les bonus" du menu déroulant).
function cumulerBonus(panoplies) {
  const total = {};
  for (const p of panoplies) {
    for (const [cle, valeur] of Object.entries(p.bonus)) {
      total[cle] = (total[cle] || 0) + valeur;
    }
  }
  return total;
}

// Sélection spéciale (à côté d'un nom de famille) représentant la vue "Cumuler
// les bonus" du menu déroulant.
const CUMUL = '__cumul__';

// N'affiche qu'un seul ensemble à la fois (ou le cumul de tous) — pour éviter
// une page à rallonge quand plusieurs familles sont actives en même temps (ex:
// des cubes Chaos comptant dans les 5 familles) ; les autres options sont
// accessibles via le menu déroulant qui s'ouvre au clic sur le nom affiché.
function PanopliesPersonnage({ panoplies }) {
  const [selection, setSelection] = useState(null);
  const [menuOuvert, setMenuOuvert] = useState(false);

  useEffect(() => {
    const selectionValide =
      (selection === CUMUL && panoplies.length >= 2) || panoplies.some((p) => p.famille === selection);
    if (!selectionValide) {
      setSelection(meilleureFamille(panoplies));
    }
  }, [panoplies, selection]);

  if (!panoplies || panoplies.length === 0) return null;

  const estCumul = selection === CUMUL && panoplies.length >= 2;
  const active = !estCumul ? panoplies.find((p) => p.famille === selection) || panoplies[0] : null;
  const bonusAffiche = estCumul ? cumulerBonus(panoplies) : active.bonus;
  const autresFamilles = panoplies.filter((p) => p.famille !== active?.famille);
  const peutCumuler = panoplies.length >= 2;
  const menuDisponible = autresFamilles.length > 0 || (peutCumuler && !estCumul);

  const libelleDeclencheur = estCumul
    ? `Bonus cumulés (${panoplies.length} ensembles)`
    : `Ensemble de Cubes ${active.famille} (${active.nombre})`;

  return (
    <div className="panoplies-personnage">
      <p className="panoplies-personnage__label">Ensembles de cubes :</p>

      <div className="panoplies-personnage__selecteur">
        {menuDisponible ? (
          <button
            type="button"
            className="panoplies-personnage__declencheur"
            onClick={() => setMenuOuvert((o) => !o)}
            aria-expanded={menuOuvert}
          >
            <span>{libelleDeclencheur}</span>
            <span className={`panoplies-personnage__fleche ${menuOuvert ? 'panoplies-personnage__fleche--ouvert' : ''}`}>
              ▼
            </span>
          </button>
        ) : (
          <div className="panoplies-personnage__declencheur panoplies-personnage__declencheur--seul">
            <span>{libelleDeclencheur}</span>
          </div>
        )}

        {menuOuvert && menuDisponible && (
          <ul className="panoplies-personnage__menu">
            {autresFamilles.map((p) => (
              <li key={p.famille}>
                <button
                  type="button"
                  onClick={() => {
                    setSelection(p.famille);
                    setMenuOuvert(false);
                  }}
                >
                  Ensemble de Cubes {p.famille} ({p.nombre})
                </button>
              </li>
            ))}
            {peutCumuler && !estCumul && (
              <li>
                <button
                  type="button"
                  className="panoplies-personnage__menu-cumul"
                  onClick={() => {
                    setSelection(CUMUL);
                    setMenuOuvert(false);
                  }}
                >
                  Cumuler les bonus
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      <ul className="panoplies-personnage__stats">
        {Object.entries(bonusAffiche).map(([cle, valeur]) => {
          const { icone, couleur, libelle } = configStat(cle);
          return (
            <li key={cle} className="panoplies-personnage__ligne">
              <span className="panoplies-personnage__valeur">{valeur}</span>
              <span className="panoplies-personnage__icone">
                <IconeStat cle={cle} icone={icone} couleur={couleur} taille={15} />
              </span>
              <span className="panoplies-personnage__libelle">{libelle}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default PanopliesPersonnage;
