import { useEffect, useState } from 'react';
import { listerBreloques } from '../api/breloques';
import { RANGS_MAITRISE } from '../constants/rangsMaitrise';
import BreloqueCard from '../components/BreloqueCard';
import './BreloqueListPage.css';

const PAR_PAGE = 24;

// Plusieurs filtres actifs en même temps (ajoute/retire de la liste).
function basculerMulti(liste, valeur) {
  return liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur];
}

function BreloqueListPage() {
  const [recherche, setRecherche] = useState('');
  const [rangsActifs, setRangsActifs] = useState([]);
  const [page, setPage] = useState(0);
  const [breloques, setBreloques] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    setPage(0);
  }, [recherche, rangsActifs]);

  useEffect(() => {
    setChargement(true);
    setErreur(null);

    listerBreloques({ nom: recherche, rangs: rangsActifs, limite: PAR_PAGE, offset: page * PAR_PAGE })
      .then(setBreloques)
      .catch(() => setErreur('Impossible de charger les breloques. Le serveur est-il lancé ?'))
      .finally(() => setChargement(false));
  }, [recherche, rangsActifs, page]);

  return (
    <div className="page-breloques">
      <h1>Breloques du Dédale</h1>

      <div className="page-breloques__filtres">
        <input
          type="text"
          placeholder="Rechercher une breloque..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />

        <div className="page-breloques__rangs">
          {RANGS_MAITRISE.map((rang) => (
            <button
              key={rang}
              className={rangsActifs.includes(rang) ? 'actif' : ''}
              onClick={() => setRangsActifs((actuels) => basculerMulti(actuels, rang))}
            >
              {rang}
            </button>
          ))}
        </div>
      </div>

      {erreur && <p className="page-breloques__erreur">{erreur}</p>}
      {chargement && <p>Chargement...</p>}
      {!chargement && !erreur && breloques.length === 0 && <p>Aucune breloque ne correspond à ta recherche.</p>}

      <div className="page-breloques__grille">
        {breloques.map((breloque) => (
          <BreloqueCard key={breloque.id} breloque={breloque} />
        ))}
      </div>

      <div className="page-breloques__pagination">
        <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          ← Page précédente
        </button>
        <span>Page {page + 1}</span>
        <button disabled={breloques.length < PAR_PAGE} onClick={() => setPage((p) => p + 1)}>
          Page suivante →
        </button>
      </div>
    </div>
  );
}

export default BreloqueListPage;
