import { useState } from 'react';
import ensemblesData from '../data/ensembles.json';
import EnsembleCard from '../components/EnsembleCard';
import EnsembleDetail from '../components/EnsembleDetail';
import Modal from '../components/Modal';
import './EnsembleListPage.css';

const SECTIONS = [
  { type: 'cube', titre: 'Ensembles de cubes' },
  { type: 'classique', titre: 'Ensembles classiques' },
  { type: 'boss', titre: 'Ensembles de boss' },
];

function EnsembleListPage() {
  const [ensembleOuvert, setEnsembleOuvert] = useState(null);

  return (
    <div className="page-ensembles">
      <h1>Ensembles du Dédale</h1>
      <p className="page-ensembles__intro">
        Équipe plusieurs pièces d'un même ensemble pour obtenir des bonus cumulatifs. Clique sur un
        ensemble pour voir le détail de tous ses paliers et de ses pièces.
      </p>

      {SECTIONS.map(({ type, titre }) => {
        const ensembles = ensemblesData.filter((e) => e.type === type);
        if (ensembles.length === 0) return null;

        return (
          <section key={type} className="page-ensembles__section">
            <h2>{titre}</h2>
            <div className="page-ensembles__grille">
              {ensembles.map((ensemble) => (
                <EnsembleCard key={ensemble.cle} ensemble={ensemble} onClick={() => setEnsembleOuvert(ensemble)} />
              ))}
            </div>
          </section>
        );
      })}

      {ensembleOuvert && (
        <Modal large onClose={() => setEnsembleOuvert(null)}>
          <EnsembleDetail ensemble={ensembleOuvert} />
        </Modal>
      )}
    </div>
  );
}

export default EnsembleListPage;
