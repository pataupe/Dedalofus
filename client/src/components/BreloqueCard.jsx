import { trouverEnsemblesPiece } from '../utils/ensembles';
import EnsembleLien from './EnsembleLien';
import './BreloqueCard.css';

// `actions` (optionnel) : boutons Équiper/Remplacer/Enlever rendus dans le
// pied de la carte plutôt qu'en élément détaché à côté.
function BreloqueCard({ breloque, actions, perso }) {
  const ensembles = trouverEnsemblesPiece('breloque', breloque.nom);

  return (
    <div className="carte-breloque">
      <div className="carte-breloque__entete">
        <h3 className="carte-breloque__titre">{breloque.nom}</h3>
        <p className="carte-breloque__soustitre">Breloque &middot; {breloque.rang}</p>
        {ensembles.length > 0 && <EnsembleLien ensembles={ensembles} perso={perso} />}
      </div>
      <div className="carte-breloque__corps">
        <div className="carte-breloque__image">
          {breloque.image_url ? (
            <img src={breloque.image_url} alt={breloque.nom} />
          ) : (
            <div className="carte-breloque__placeholder" aria-hidden="true" />
          )}
        </div>
        <p className="carte-breloque__effet">{breloque.effet}</p>
      </div>
      {actions && <div className="carte-breloque__actions">{actions}</div>}
    </div>
  );
}

export default BreloqueCard;
