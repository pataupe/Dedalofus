import { useState } from 'react';
import Modal from './Modal';
import EnsembleDetail from './EnsembleDetail';
import './EnsembleLien.css';

// Lien(s) "Ensemble de xxx" affichés sur une CubeCard/BreloqueCard/SortCard quand
// l'item appartient à un ensemble (généralement 1, jusqu'à 5 pour un cube Chaos).
// Autonome : possède sa propre modale plutôt que de faire remonter un état vers
// chaque page qui rend ces cards (CubeListPage, PersonnageDetailPage, PartagePage,
// OngletSorts, ModaleRemplacement...).
function EnsembleLien({ ensembles }) {
  const [ensembleOuvert, setEnsembleOuvert] = useState(null);

  if (!ensembles || ensembles.length === 0) return null;

  function ouvrir(e, ensemble) {
    // Les cards sont souvent elles-mêmes cliquables (lien vers le détail, ouverture
    // d'une modale d'item...) : évite de déclencher aussi cette action parente.
    e.stopPropagation();
    e.preventDefault();
    setEnsembleOuvert(ensemble);
  }

  return (
    <>
      <div className="ensemble-lien">
        {ensembles.map((ensemble) => (
          <button key={ensemble.cle} type="button" className="ensemble-lien__bouton" onClick={(e) => ouvrir(e, ensemble)}>
            {ensemble.nom}
          </button>
        ))}
      </div>

      {ensembleOuvert && (
        <Modal large onClose={() => setEnsembleOuvert(null)}>
          <EnsembleDetail ensemble={ensembleOuvert} />
        </Modal>
      )}
    </>
  );
}

export default EnsembleLien;
