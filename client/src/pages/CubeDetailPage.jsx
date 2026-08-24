import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { obtenirCube } from '../api/cubes';
import CubeCard from '../components/CubeCard';
import './CubeDetailPage.css';

function CubeDetailPage() {
  const { id } = useParams();
  const [cube, setCube] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [searchParams] = useSearchParams();
  const perso = searchParams.get('perso');
  const emplacement = searchParams.get('emplacement');
  // Repropage le contexte "équipement" (venu de la liste, ?perso=&emplacement=)
  // dans le lien retour : sans ça, revenir à la liste depuis la fiche d'un cube
  // perdait ce contexte et retombait sur la liste en lecture seule, sans bouton
  // Équiper — bug repéré de longue date, propre aux cubes (seul type avec une
  // vraie page de détail cliquable).
  const lienRetour = perso ? `/cubes?perso=${perso}${emplacement ? `&emplacement=${emplacement}` : ''}` : '/cubes';

  useEffect(() => {
    setCube(null);
    setErreur(null);
    obtenirCube(id)
      .then(setCube)
      .catch(() => setErreur('Ce cube est introuvable.'));
  }, [id]);

  return (
    <div className="page-detail-cube">
      <Link to={lienRetour} className="page-detail-cube__retour">
        ← Retour à la liste
      </Link>

      {erreur && <p className="page-cubes__erreur">{erreur}</p>}
      {!cube && !erreur && <p>Chargement...</p>}

      {cube && (
        <div className="page-detail-cube__carte">
          <CubeCard cube={cube} />
        </div>
      )}
    </div>
  );
}

export default CubeDetailPage;
