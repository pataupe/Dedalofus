import { useState } from 'react';
import Modal from './Modal';
import EnsembleDetail from './EnsembleDetail';
import BonusPalier from './BonusPalier';
import { obtenirEnsemble } from '../utils/ensembles';
import './EnsemblesPersonnage.css';

// Ensembles classiques/boss actuellement actifs (>= 1 pièce reconnue équipée), à
// côté de PanopliesPersonnage (qui garde les ensembles de cubes, mécanisme séparé).
// `ensembles` = personnage.ensemblesActifs (résumé calculé côté serveur : cle, nom,
// nombrePieces, palier, bonusTexte, bonusSpecial — pas la liste complète des pièces/
// paliers), donc le détail complet affiché dans la modale vient d'ensembles.json
// (obtenirEnsemble) plutôt que de cet objet résumé.
function EnsemblesPersonnage({ ensembles }) {
  const [clesOuverte, setClesOuverte] = useState(null);

  if (!ensembles || ensembles.length === 0) return null;

  const ensembleDetailOuvert = clesOuverte ? obtenirEnsemble(clesOuverte) : null;

  return (
    <div className="ensembles-personnage">
      <p className="ensembles-personnage__label">Ensembles actifs :</p>
      <ul className="ensembles-personnage__liste">
        {ensembles.map((ensemble) => (
          <li key={ensemble.cle} className="ensembles-personnage__item">
            <button
              type="button"
              className="ensembles-personnage__ligne"
              onClick={() => setClesOuverte(ensemble.cle)}
            >
              <span className="ensembles-personnage__nom">
                {ensemble.nom} ({ensemble.nombrePieces})
              </span>
              {ensemble.bonusSpecial && (
                <span className="ensembles-personnage__bonus-special">✨ {ensemble.bonusSpecial.texte}</span>
              )}
            </button>
            <BonusPalier delta={ensemble.delta} />
          </li>
        ))}
      </ul>

      {ensembleDetailOuvert && (
        <Modal large onClose={() => setClesOuverte(null)}>
          <EnsembleDetail ensemble={ensembleDetailOuvert} />
        </Modal>
      )}
    </div>
  );
}

export default EnsemblesPersonnage;
