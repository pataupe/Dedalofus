import IconeStat from './IconeStat';
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

// `actions` (optionnel) : boutons Équiper/Remplacer/Enlever rendus dans le
// pied de la carte plutôt qu'en élément détaché à côté.
function BreuvageCard({ breuvage, actions }) {
  return (
    <div className="carte-breuvage">
      <div className="carte-breuvage__entete">
        <h3 className="carte-breuvage__titre">{breuvage.nom}</h3>
        <p className="carte-breuvage__soustitre">Breuvage &middot; {breuvage.rang}</p>
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
          <IconeStat cle={breuvage.cle_stat} couleur="var(--or)" taille={16} />
          {breuvage.valeur_stat} {LIBELLES_STAT[breuvage.cle_stat] || breuvage.cle_stat}
        </p>
      </div>
      {actions && <div className="carte-breuvage__actions">{actions}</div>}
    </div>
  );
}

export default BreuvageCard;
