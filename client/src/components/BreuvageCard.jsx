import './BreuvageCard.css';

// Libellés des 10 stats boostées par un breuvage (une seule par breuvage) —
// mêmes noms que STATS_CUBES pour les clés qui y figurent déjà, complété par
// TACLE (pas une stat cube, cf. constants/statsCubes.js).
const LIBELLES_STAT = {
  INTELLIGENCE: 'Intelligence',
  FORCE: 'Force',
  CHANCE: 'Chance',
  AGILITE: 'Agilité',
  VITALITE: 'Vitalité',
  PUISSANCE: 'Puissance',
  DO_CRIT: 'Dommages Critiques',
  DO_POU: 'Dommages Poussée',
  FUITE: 'Fuite',
  TACLE: 'Tacle',
};

function BreuvageCard({ breuvage }) {
  return (
    <div className="carte-breuvage">
      <div className="carte-breuvage__entete">
        {breuvage.nom} — {breuvage.rang}
      </div>
      <div className="carte-breuvage__corps">
        <div className="carte-breuvage__image">
          {breuvage.image_url ? (
            <img src={breuvage.image_url} alt={breuvage.nom} />
          ) : (
            <div className="carte-breuvage__placeholder" aria-hidden="true" />
          )}
        </div>
        <p className="carte-breuvage__stat">
          +{breuvage.valeur_stat} {LIBELLES_STAT[breuvage.cle_stat] || breuvage.cle_stat}
        </p>
      </div>
    </div>
  );
}

export default BreuvageCard;
