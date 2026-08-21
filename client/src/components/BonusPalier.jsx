import { ICONES_ENSEMBLES, ICONES_MULTIPLICATEURS, ICONES_INDICATIFS } from '../constants/iconesEnsembles';
import './BonusPalier.css';

// Une ligne par stat (jamais regroupées, ex: "Retrait PA/PM" devient 2 lignes
// distinctes) : icône à gauche, puis la valeur (sans signe "+"), puis le libellé —
// mêmes libellés/icônes que StatsPersonnage.jsx (client/src/constants/iconesEnsembles.js,
// tenu synchronisé à la main). Utilisé à la fois par EnsembleDetail.jsx (modale de
// détail) et EnsemblesPersonnage.jsx (résumé sur la fiche perso) — un seul endroit à
// faire évoluer si le format change.
function LigneBonus({ icone, couleur, libelle, valeur }) {
  return (
    <li className="bonus-palier__ligne">
      <span className="bonus-palier__icone" style={{ background: couleur }}>
        {icone}
      </span>
      <span className="bonus-palier__valeur">{valeur}</span>
      <span className="bonus-palier__libelle">{libelle}</span>
    </li>
  );
}

// Rend le detail d'un palier à partir du delta structuré (pas du texte brut) : une
// ligne par clé de statsPlates (déjà séparées), une ligne par multiplicateur, une ligne
// par "indicatif" (ex: % résistances distance/mêlée — affiché avec icône comme les
// autres, mais sans aucun impact sur le calcul, cf. sorts-degats-indirects.md), puis les
// notes textuelles vraiment non reconnues ("Aucun bonus"...) — rien n'est
// silencieusement perdu.
function BonusPalier({ delta }) {
  const statsEntries = Object.entries(delta?.statsPlates || {});
  const multiplicateurs = delta?.multiplicateurs || [];
  const indicatifs = delta?.indicatifs || [];
  const notes = delta?.notes || [];

  if (statsEntries.length === 0 && multiplicateurs.length === 0 && indicatifs.length === 0 && notes.length === 0) {
    return <p className="bonus-palier__note">Aucun bonus</p>;
  }

  return (
    <ul className="bonus-palier__liste">
      {statsEntries.map(([cle, valeur]) => {
        // Repli générique (🔹, libellé = clé brute) si jamais une stat de PANOPLIES/
        // parserBonusTexte n'a pas encore d'entrée ici — mieux vaut un rendu moche
        // et visible qu'une ligne qui disparaît sans laisser de trace (bug vécu :
        // AGILITE/DO_AIR/DOMMAGES manquants faisaient disparaître 3 stats sur 5 des
        // ensembles de cubes élémentaires, sans aucune erreur ni log).
        const config = ICONES_ENSEMBLES[cle] || { icone: '🔹', couleur: 'var(--texte-attenue)', libelle: cle };
        return <LigneBonus key={cle} icone={config.icone} couleur={config.couleur} libelle={config.libelle} valeur={valeur} />;
      })}
      {multiplicateurs.map((mult, i) => {
        const config = ICONES_MULTIPLICATEURS[mult.type] || { icone: '🔹', couleur: 'var(--texte-attenue)', libelle: mult.type };
        const pourcent = Math.round((mult.valeur - 1) * 100);
        return (
          <LigneBonus key={`m-${i}`} icone={config.icone} couleur={config.couleur} libelle={config.libelle} valeur={`${pourcent}%`} />
        );
      })}
      {indicatifs.map((ind, i) => {
        const config = ICONES_INDICATIFS[ind.type] || { icone: '🔹', couleur: 'var(--texte-attenue)', libelle: ind.type };
        return <LigneBonus key={`i-${i}`} icone={config.icone} couleur={config.couleur} libelle={config.libelle} valeur={`${ind.valeur}%`} />;
      })}
      {notes.map((note, i) => (
        <li key={`n-${i}`} className="bonus-palier__note">
          {note}
        </li>
      ))}
    </ul>
  );
}

export default BonusPalier;
