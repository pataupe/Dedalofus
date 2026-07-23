import { useEffect, useState } from 'react';
import { STATS_CUBES } from '../constants/statsCubes';
import './PanopliesPersonnage.css';

// Même ordre que dans compterCubesParFamille (server/logic/calcul.js), sert juste
// à départager deux familles à égalité de nombre de cubes.
const ORDRE_FAMILLES = ['Air', 'Feu', 'Terre', 'Eau', 'Lumière'];

// Icône + couleur par stat, même convention que StatsPersonnage.jsx (simple emoji,
// pas de vraie icône en V1). Couvre toutes les stats de STATS_CUBES puisque les
// bonus de panoplie peuvent en théorie en utiliser n'importe laquelle.
const ICONES_STATS = {
  AGILITE: { icone: '🍃', couleur: 'var(--couleur-air)' },
  CHANCE: { icone: '💧', couleur: 'var(--couleur-eau)' },
  DOMMAGES: { icone: '✨', couleur: 'var(--couleur-lumiere)' },
  DO_AIR: { icone: '🍃', couleur: 'var(--couleur-air)' },
  DO_CRIT: { icone: '🎯', couleur: 'var(--couleur-feu)' },
  DO_EAU: { icone: '💧', couleur: 'var(--couleur-eau)' },
  DO_FEU: { icone: '🔥', couleur: 'var(--couleur-feu)' },
  DO_POU: { icone: '➡️', couleur: 'var(--texte-attenue)' },
  DO_TERRE: { icone: '🌾', couleur: 'var(--couleur-terre)' },
  ESQUIVE_PA: { icone: '🛡️', couleur: 'var(--couleur-eau)' },
  ESQUIVE_PM: { icone: '🛡️', couleur: 'var(--couleur-air)' },
  FORCE: { icone: '🌾', couleur: 'var(--couleur-terre)' },
  FUITE: { icone: '➡️', couleur: 'var(--couleur-terre)' },
  INITIATIVE: { icone: '🪽', couleur: 'var(--couleur-chaos)' },
  INTELLIGENCE: { icone: '🔥', couleur: 'var(--couleur-feu)' },
  INVOCATION: { icone: '👹', couleur: 'var(--couleur-chaos)' },
  PA: { icone: '⭐', couleur: 'var(--couleur-lumiere)' },
  PM: { icone: '🔷', couleur: 'var(--couleur-air)' },
  PO: { icone: '👁️', couleur: 'var(--couleur-eau)' },
  PUISSANCE: { icone: '⚡', couleur: 'var(--couleur-lumiere)' },
  RES_AIR: { icone: '🍃', couleur: 'var(--couleur-air)' },
  RES_CRIT: { icone: '🛡️', couleur: 'var(--couleur-feu)' },
  RES_EAU: { icone: '💧', couleur: 'var(--couleur-eau)' },
  RES_FEU: { icone: '🔥', couleur: 'var(--couleur-feu)' },
  RES_NEUTRE: { icone: '☯️', couleur: 'var(--texte-attenue)' },
  RES_POU: { icone: '🛡️', couleur: 'var(--texte-attenue)' },
  RES_TERRE: { icone: '🌾', couleur: 'var(--couleur-terre)' },
  SAGESSE: { icone: '🌙', couleur: 'var(--couleur-chaos)' },
  SOIN: { icone: '✚', couleur: 'var(--couleur-feu)' },
  VITALITE: { icone: '❤️', couleur: 'var(--couleur-feu)' },
  '%_COUP_CRITIQUE': { icone: '❗', couleur: 'var(--couleur-feu)' },
  '%_RES_AIR': { icone: '🍃', couleur: 'var(--couleur-air)' },
  '%_RES_EAU': { icone: '💧', couleur: 'var(--couleur-eau)' },
  '%_RES_FEU': { icone: '🔥', couleur: 'var(--couleur-feu)' },
  '%_RES_NEUTRE': { icone: '☯️', couleur: 'var(--texte-attenue)' },
  '%_RES_TERRE': { icone: '🌾', couleur: 'var(--couleur-terre)' },
};

function libelleStat(cle) {
  return STATS_CUBES.find((s) => s.cle === cle)?.libelle || cle;
}

function iconeStat(cle) {
  return ICONES_STATS[cle] || { icone: '🔹', couleur: 'var(--texte-attenue)' };
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
      <p className="panoplies-personnage__label">Bonus de panoplie :</p>

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
          const { icone, couleur } = iconeStat(cle);
          return (
            <li key={cle} className="panoplies-personnage__ligne">
              <span className="panoplies-personnage__valeur">{valeur}</span>
              <span className="panoplies-personnage__icone" style={{ background: couleur }}>
                {icone}
              </span>
              <span className="panoplies-personnage__libelle">{libelleStat(cle)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default PanopliesPersonnage;
