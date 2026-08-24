import { useEffect, useState } from 'react';
import BonusPalier from './BonusPalier';
import './EnsemblesPersonnage.css';

// Sélection spéciale (à côté d'une clé d'ensemble) représentant la vue "Cumuler
// les bonus" du menu déroulant — même mécanisme que PanopliesPersonnage.jsx.
const CUMUL = '__cumul__';

// Un ensemble dont le palier atteint n'apporte encore aucun bonus réel (delta
// vide, juste une note "Aucun bonus" ou similaire — cf. BonusPalier.jsx) est
// filtré entièrement : il ne doit pas apparaître dans le sélecteur ni au menu.
// Le bonus spécial (✨, indépendant du delta) compte comme un contenu réel.
function aBonusReel(ensemble) {
  const delta = ensemble.delta || {};
  const deltaVide =
    Object.keys(delta.statsPlates || {}).length === 0 &&
    (delta.multiplicateurs || []).length === 0 &&
    (delta.indicatifs || []).length === 0;
  return !deltaVide || !!ensemble.bonusSpecial;
}

// Ensemble affiché par défaut : celui avec le plus de pièces équipées.
function meilleurEnsemble(ensembles) {
  return [...ensembles].sort((a, b) => b.nombrePieces - a.nombrePieces)[0];
}

// Somme les deltas de tous les ensembles actifs, stat par stat (option
// "Cumuler les bonus"), même principe que cumulerBonus dans PanopliesPersonnage.jsx.
function cumulerDeltas(ensembles) {
  const statsPlates = {};
  const multiplicateurs = [];
  const indicatifs = [];
  for (const e of ensembles) {
    const delta = e.delta || {};
    for (const [cle, valeur] of Object.entries(delta.statsPlates || {})) {
      statsPlates[cle] = (statsPlates[cle] || 0) + valeur;
    }
    multiplicateurs.push(...(delta.multiplicateurs || []));
    indicatifs.push(...(delta.indicatifs || []));
  }
  return { statsPlates, multiplicateurs, indicatifs };
}

// Ensembles classiques/boss actuellement actifs (>= 1 pièce reconnue équipée), à
// côté de PanopliesPersonnage (qui garde les ensembles de cubes, mécanisme séparé)
// — même mécanisme de sélecteur que PanopliesPersonnage.jsx (un seul ensemble
// affiché à la fois, menu déroulant pour changer, option pour cumuler).
function EnsemblesPersonnage({ ensembles }) {
  const [selection, setSelection] = useState(null);
  const [menuOuvert, setMenuOuvert] = useState(false);

  const visibles = (ensembles || []).filter(aBonusReel);

  useEffect(() => {
    const selectionValide =
      (selection === CUMUL && visibles.length >= 2) || visibles.some((e) => e.cle === selection);
    if (!selectionValide) {
      setSelection(meilleurEnsemble(visibles)?.cle ?? null);
    }
  }, [visibles, selection]);

  if (visibles.length === 0) return null;

  const estCumul = selection === CUMUL && visibles.length >= 2;
  const active = !estCumul ? visibles.find((e) => e.cle === selection) || visibles[0] : null;
  const deltaAffiche = estCumul ? cumulerDeltas(visibles) : active.delta;
  const autresEnsembles = visibles.filter((e) => e.cle !== active?.cle);
  const peutCumuler = visibles.length >= 2;
  const menuDisponible = autresEnsembles.length > 0 || (peutCumuler && !estCumul);

  const libelleDeclencheur = estCumul
    ? `Bonus cumulés (${visibles.length} ensembles)`
    : `${active.nom} (${active.nombrePieces})`;

  // En cumul, les bonus spéciaux (✨, indépendants du delta) de tous les
  // ensembles affichés sont regroupés en haut plutôt que perdus — un seul à la
  // fois n'était montré qu'en vue "un ensemble" (active.bonusSpecial). Préfixés
  // par le nom de l'ensemble en cumul (ambigu sinon, avec plusieurs sources),
  // pas en vue simple (déjà évident, un seul ensemble affiché).
  const bonusSpeciaux = estCumul
    ? visibles.filter((e) => e.bonusSpecial).map((e) => ({ cle: e.cle, texte: `${e.nom} : ${e.bonusSpecial.texte}` }))
    : active.bonusSpecial
      ? [{ cle: active.cle, texte: active.bonusSpecial.texte }]
      : [];

  return (
    <div className="ensembles-personnage">
      <p className="ensembles-personnage__label">Autres ensembles :</p>

      <div className="ensembles-personnage__selecteur">
        {menuDisponible ? (
          <button
            type="button"
            className="ensembles-personnage__declencheur"
            onClick={() => setMenuOuvert((o) => !o)}
            aria-expanded={menuOuvert}
          >
            <span>{libelleDeclencheur}</span>
            <span className={`ensembles-personnage__fleche ${menuOuvert ? 'ensembles-personnage__fleche--ouvert' : ''}`}>
              ▼
            </span>
          </button>
        ) : (
          <div className="ensembles-personnage__declencheur ensembles-personnage__declencheur--seul">
            <span>{libelleDeclencheur}</span>
          </div>
        )}

        {menuOuvert && menuDisponible && (
          <ul className="ensembles-personnage__menu">
            {autresEnsembles.map((e) => (
              <li key={e.cle}>
                <button
                  type="button"
                  onClick={() => {
                    setSelection(e.cle);
                    setMenuOuvert(false);
                  }}
                >
                  {e.nom} ({e.nombrePieces})
                </button>
              </li>
            ))}
            {peutCumuler && !estCumul && (
              <li>
                <button
                  type="button"
                  className="ensembles-personnage__menu-cumul"
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

      {bonusSpeciaux.length > 0 && (
        <ul className="ensembles-personnage__bonus-speciaux">
          {bonusSpeciaux.map((b) => (
            <li key={b.cle}>✨ {b.texte}</li>
          ))}
        </ul>
      )}

      <BonusPalier delta={deltaAffiche} />
    </div>
  );
}

export default EnsemblesPersonnage;
