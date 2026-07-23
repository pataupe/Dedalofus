import { useEffect, useState } from 'react';
import { sauvegarderParcho as sauvegarderParchoApi } from '../api/personnages';
import './StatsPersonnage.css';

// Regroupement en blocs façon DofusBook. Les clés viennent soit directement
// des stats brutes des cubes (ex: FORCE), soit des stats dérivées calculées
// par `calculerStatsPersonnage` (server/logic/calcul.js) — respecter le mélange
// `_TOTAL`/`_TOTALE` exact, ce sont les noms réellement produits par ce module.
// `icone`/`couleur` : simples emoji + couleur d'élément existante (pas de vraies
// icônes en V1), juste pour retrouver visuellement le repère DofusBook.
// Bloc "Principal" affiché en 2 colonnes fixes (pas l'auto-répartition des
// autres blocs) : PdV/PA/PM/PO à gauche, le reste à droite. PdV a `vedette:
// true` pour ressortir légèrement des 7 autres stats du bloc.
const PRINCIPAL_GAUCHE = [
  { cle: 'VITALITE_TOTALE', libelle: 'PdV', icone: '❤️', couleur: 'var(--couleur-feu)', vedette: true },
  { cle: 'PA_TOTAL', libelle: 'PA', icone: '⭐', couleur: 'var(--couleur-lumiere)' },
  { cle: 'PM_TOTAL', libelle: 'PM', icone: '🔷', couleur: 'var(--couleur-air)' },
  { cle: 'PO', libelle: 'PO', icone: '👁️', couleur: 'var(--couleur-eau)' },
];

const PRINCIPAL_DROITE = [
  { cle: 'INVOCATION_TOTALE', libelle: 'Invoc.', icone: '👹', couleur: 'var(--couleur-chaos)' },
  { cle: 'INITIATIVE_TOTALE', libelle: 'Init.', icone: '🪽', couleur: 'var(--couleur-chaos)' },
  { cle: '%_COUP_CRITIQUE', libelle: 'Crit. %', icone: '❗', couleur: 'var(--couleur-feu)' },
  { cle: 'SOIN', libelle: 'Soin', icone: '✚', couleur: 'var(--couleur-feu)' },
];

const BLOCS = [
  {
    titre: 'Mobilité',
    lignes: [
      { cle: 'FUITE_TOTALE', libelle: 'Fuite', icone: '➡️', couleur: 'var(--couleur-terre)' },
      { cle: 'TACLE_TOTAL', libelle: 'Tacle', icone: '🐾', couleur: 'var(--couleur-lumiere)' },
      { cle: 'ESQUIVE_PA_TOTALE', libelle: 'Esq. PA', icone: '🛡️', couleur: 'var(--couleur-eau)' },
      { cle: 'ESQUIVE_PM_TOTALE', libelle: 'Esq. PM', icone: '🛡️', couleur: 'var(--couleur-air)' },
      { cle: 'RETRAIT_PA_TOTAL', libelle: 'Ret. PA', icone: '⬇️', couleur: 'var(--couleur-eau)' },
      { cle: 'RETRAIT_PM_TOTAL', libelle: 'Ret. PM', icone: '⬇️', couleur: 'var(--couleur-air)' },
    ],
  },
  {
    titre: 'Dommages',
    lignes: [
      { cle: 'DOMMAGES_FEU_TOTAL', libelle: 'Do Feu', icone: '🔥', couleur: 'var(--couleur-feu)' },
      { cle: 'DOMMAGES_TERRE_TOTAL', libelle: 'Do Terre', icone: '🌾', couleur: 'var(--couleur-terre)' },
      { cle: 'DOMMAGES_EAU_TOTAL', libelle: 'Do Eau', icone: '💧', couleur: 'var(--couleur-eau)' },
      { cle: 'DOMMAGES_AIR_TOTAL', libelle: 'Do Air', icone: '🍃', couleur: 'var(--couleur-air)' },
      { cle: 'DO_CRIT', libelle: 'Do Crit.', icone: '🎯', couleur: 'var(--couleur-feu)' },
      { cle: 'DO_POU', libelle: 'Do Pou.', icone: '➡️', couleur: 'var(--texte-attenue)' },
    ],
  },
  {
    titre: 'Résistances',
    lignes: [
      { cle: 'RES_NEUTRE', libelle: 'Ré Neutre', icone: '☯️', couleur: 'var(--texte-attenue)' },
      { cle: '%_RES_NEUTRE', libelle: '% Ré Neutre', icone: '☯️', couleur: 'var(--texte-attenue)' },
      { cle: 'RES_TERRE', libelle: 'Ré Terre', icone: '🌾', couleur: 'var(--couleur-terre)' },
      { cle: '%_RES_TERRE', libelle: '% Ré Terre', icone: '🌾', couleur: 'var(--couleur-terre)' },
      { cle: 'RES_FEU', libelle: 'Ré Feu', icone: '🔥', couleur: 'var(--couleur-feu)' },
      { cle: '%_RES_FEU', libelle: '% Ré Feu', icone: '🔥', couleur: 'var(--couleur-feu)' },
      { cle: 'RES_EAU', libelle: 'Ré Eau', icone: '💧', couleur: 'var(--couleur-eau)' },
      { cle: '%_RES_EAU', libelle: '% Ré Eau', icone: '💧', couleur: 'var(--couleur-eau)' },
      { cle: 'RES_AIR', libelle: 'Ré Air', icone: '🍃', couleur: 'var(--couleur-air)' },
      { cle: '%_RES_AIR', libelle: '% Ré Air', icone: '🍃', couleur: 'var(--couleur-air)' },
      { cle: 'RES_CRIT', libelle: 'Ré Crit.', icone: '🛡️', couleur: 'var(--couleur-feu)' },
      { cle: 'RES_POU', libelle: 'Ré Pou.', icone: '🛡️', couleur: 'var(--texte-attenue)' },
    ],
  },
];

// Les 6 caractéristiques qui ont une case "Parcho" éditable (dans cet ordre
// précis, façon DofusBook). Puissance n'a pas de Parcho, elle reste à part.
const CARACTERISTIQUES_EDITABLES = [
  { cle: 'VITALITE', libelle: 'Vitalité', icone: '❤️', couleur: 'var(--couleur-feu)' },
  { cle: 'SAGESSE', libelle: 'Sagesse', icone: '🌙', couleur: 'var(--couleur-chaos)' },
  { cle: 'FORCE', libelle: 'Force', icone: '🌾', couleur: 'var(--couleur-terre)' },
  { cle: 'INTELLIGENCE', libelle: 'Intel.', icone: '🔥', couleur: 'var(--couleur-feu)' },
  { cle: 'CHANCE', libelle: 'Chance', icone: '💧', couleur: 'var(--couleur-eau)' },
  { cle: 'AGILITE', libelle: 'Agilité', icone: '🍃', couleur: 'var(--couleur-air)' },
];

const BOUTONS_REMPLISSAGE = [0, 100, 150];

function Icone({ emoji, couleur }) {
  return (
    <span className="stats-personnage__icone" style={{ background: couleur }}>
      {emoji}
    </span>
  );
}

function LigneStat({ cle, libelle, icone, couleur, valeur, vedette }) {
  return (
    <li className={`stats-personnage__ligne ${vedette ? 'stats-personnage__ligne--vedette' : ''}`}>
      <span className="stats-personnage__valeur">{valeur}</span>
      <Icone emoji={icone} couleur={couleur} />
      <span className="stats-personnage__libelle">{libelle}</span>
    </li>
  );
}

function StatsPersonnage({ stats, parcho, token, personnageId, onParchoSauvegarde }) {
  const [parchoLocal, setParchoLocal] = useState(parcho);
  const [erreurParcho, setErreurParcho] = useState(null);

  useEffect(() => {
    setParchoLocal(parcho);
  }, [parcho]);

  async function sauvegarder(valeurs) {
    setErreurParcho(null);
    try {
      await sauvegarderParchoApi(token, personnageId, valeurs);
      // Les stats dérivées (PdV, Tacle, Fuite, Retrait/Esquive PA-PM...) dépendent du
      // Parcho côté serveur (calculerStatsPersonnage) : on redemande la fiche perso
      // pour les mettre à jour, plutôt que de dupliquer ces formules en JS ici.
      onParchoSauvegarde?.();
    } catch (err) {
      setErreurParcho(err.message);
    }
  }

  function modifierParcho(cle, valeurBrute) {
    const valeur = valeurBrute === '' ? 0 : Math.max(0, parseInt(valeurBrute, 10) || 0);
    setParchoLocal((p) => ({ ...p, [cle]: valeur }));
  }

  function remplirTout(valeur) {
    const nouveau = Object.fromEntries(CARACTERISTIQUES_EDITABLES.map((c) => [c.cle, valeur]));
    setParchoLocal(nouveau);
    sauvegarder(nouveau);
  }

  return (
    <div className="stats-personnage">
      <div className="stats-personnage__bloc">
        <h2 className="stats-personnage__titre">Principal</h2>
        <div className="stats-personnage__deux-colonnes">
          <ul className="stats-personnage__colonne">
            {PRINCIPAL_GAUCHE.map((ligne) => (
              <LigneStat key={ligne.cle} {...ligne} valeur={stats[ligne.cle] || 0} />
            ))}
          </ul>
          <ul className="stats-personnage__colonne">
            {PRINCIPAL_DROITE.map((ligne) => (
              <LigneStat key={ligne.cle} {...ligne} valeur={stats[ligne.cle] || 0} />
            ))}
          </ul>
        </div>
      </div>

      <div className="stats-personnage__bloc">
        <h2 className="stats-personnage__titre">Caractéristiques</h2>
        <div className="stats-personnage__carac-entetes">
          <span>Total</span>
          <span>Parcho</span>
        </div>
        {CARACTERISTIQUES_EDITABLES.map(({ cle, libelle, icone, couleur }) => (
          <div key={cle} className="stats-personnage__carac-ligne">
            <span className="stats-personnage__carac-total">
              <span className="stats-personnage__valeur">{stats[cle] || 0}</span>
              <Icone emoji={icone} couleur={couleur} />
              <span className="stats-personnage__libelle">{libelle}</span>
            </span>
            <input
              type="number"
              min="0"
              className="stats-personnage__carac-parcho"
              value={parchoLocal[cle] ?? 0}
              onChange={(e) => modifierParcho(cle, e.target.value)}
              onBlur={(e) => {
                // On relit la valeur directement dans le champ plutôt que dans
                // parchoLocal : évite de sauvegarder une valeur pas encore à
                // jour si le blur arrive avant que le re-render du onChange
                // n'ait eu lieu (rare mais possible en saisie rapide).
                const valeur = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                sauvegarder({ ...parchoLocal, [cle]: valeur });
              }}
            />
          </div>
        ))}
        <div className="stats-personnage__carac-puissance-ligne">
          <span className="stats-personnage__carac-puissance-stat">
            <span className="stats-personnage__valeur">{stats.PUISSANCE || 0}</span>
            <Icone emoji="⚡" couleur="var(--couleur-lumiere)" />
            <span className="stats-personnage__libelle">Puissance</span>
          </span>
          <div className="stats-personnage__carac-boutons">
            {BOUTONS_REMPLISSAGE.map((valeur) => (
              <button key={valeur} type="button" onClick={() => remplirTout(valeur)}>
                {valeur}
              </button>
            ))}
          </div>
        </div>
        {erreurParcho && <p className="stats-personnage__erreur">{erreurParcho}</p>}
      </div>

      {BLOCS.map((bloc) => (
        <div key={bloc.titre} className="stats-personnage__bloc">
          <h2 className="stats-personnage__titre">{bloc.titre}</h2>
          <ul className="stats-personnage__liste">
            {bloc.lignes.map((ligne) => (
              <LigneStat key={ligne.cle} {...ligne} valeur={stats[ligne.cle] || 0} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default StatsPersonnage;
