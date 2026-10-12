import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { couleurRangMaitrise } from '../constants/rangsMaitrise';
import { useAuth } from '../context/AuthContext';
import { obtenirCube } from '../api/cubes';
import { obtenirSort } from '../api/sorts';
import { obtenirBreloque } from '../api/breloques';
import { equiperCubeAuto, equiperSortAuto, equiperBreloqueAuto } from '../api/personnages';
import Modal from './Modal';
import CubeCard from './CubeCard';
import SortCard from './SortCard';
import BreloqueCard from './BreloqueCard';
import BonusPalier from './BonusPalier';
import './EnsembleDetail.css';

// Éclate chaque pièce en une ligne par rang (Novice/Expert/Maître α/Maître ẞ), comme
// le fait touchmanager.fr — une même breloque/sort à 4 rangs différents compte comme
// 4 pièces distinctes dans ce décompte visuel. `id` (id réel en base de cette
// variante) conservé à part de `cle` (clé React) pour pouvoir aller chercher la
// fiche complète de l'item au clic (stats/effet/dégâts — pas dans ensembles.json).
function eclaterParRang(pieces) {
  return (pieces || []).flatMap((piece) =>
    piece.variantes.map((variante) => ({
      cle: `${piece.type}-${piece.nom}-${variante.id}`,
      type: piece.type,
      id: variante.id,
      nom: piece.nom,
      rang: variante.rang,
      image: variante.image_url,
    }))
  );
}

const OBTENIR_PAR_TYPE = { cube: obtenirCube, sort: obtenirSort, breloque: obtenirBreloque };
const EQUIPER_AUTO_PAR_TYPE = { cube: equiperCubeAuto, sort: equiperSortAuto, breloque: equiperBreloqueAuto };

// Résolu à l'appel (pas en constante de module) : CubeCard/SortCard/BreloqueCard
// importent chacune EnsembleLien, qui importe ce fichier — une dépendance
// circulaire qui casse si CubeCard/SortCard/BreloqueCard sont référencées dans
// un objet évalué au chargement du module (TDZ, "Cannot access before
// initialization"). Référencées seulement à l'intérieur d'une fonction, elles
// ne sont lues qu'au rendu, une fois tous les modules du cycle initialisés.
function carteEtProp(type) {
  if (type === 'cube') return { Carte: CubeCard, prop: 'cube' };
  if (type === 'sort') return { Carte: SortCard, prop: 'sort' };
  return { Carte: BreloqueCard, prop: 'breloque' };
}

// Modale imbriquée ouverte au clic sur une pièce : lecture seule par défaut
// (mêmes cartes que partout ailleurs sur le site), bouton "Équiper" en plus
// seulement si `perso` est fourni — c'est-à-dire seulement depuis la propre
// fiche du joueur connecté (jamais depuis /ensembles ni la page de partage
// publique, qui ne passent jamais cette prop). Équipement toujours automatique
// (premier emplacement libre du bon type), pas de ciblage d'un emplacement
// précis : on ne sait pas lequel viser en arrivant depuis une pièce d'ensemble.
function PieceModal({ piece, perso, onClose }) {
  const { session } = useAuth();
  const [item, setItem] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [equipe, setEquipe] = useState(false);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    setItem(null);
    setErreur(null);
    OBTENIR_PAR_TYPE[piece.type](piece.id)
      .then(setItem)
      .catch(() => setErreur('Cet objet est introuvable.'));
  }, [piece.type, piece.id]);

  async function equiper() {
    setEnCours(true);
    setErreur(null);
    try {
      await EQUIPER_AUTO_PAR_TYPE[piece.type](session.token, perso, piece.id);
      setEquipe(true);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(false);
    }
  }

  const { Carte, prop } = carteEtProp(piece.type);
  const peutEquiper = perso && session;

  const actions = peutEquiper && (
    <>
      <button type="button" className="carte-action carte-action--principale" onClick={equiper} disabled={enCours || equipe}>
        {equipe ? 'Équipé !' : enCours ? 'Équipement...' : 'Équiper'}
      </button>
      {equipe && (
        <Link to={`/personnage/${perso}`} className="carte-action carte-action--fantome">
          Voir ma fiche
        </Link>
      )}
    </>
  );

  return (
    <Modal onClose={onClose}>
      {!item && !erreur && <p>Chargement...</p>}
      {erreur && !item && <p className="detail-ensemble__erreur">{erreur}</p>}
      {item && <Carte {...{ [prop]: item }} actions={actions} />}
      {item && erreur && <p className="detail-ensemble__erreur">{erreur}</p>}
    </Modal>
  );
}

function EnsembleDetail({ ensemble, perso }) {
  const pieces = eclaterParRang(ensemble.pieces);
  const paliersAvecBonus = (ensemble.paliers || []).filter((p) => p.texte);
  const [pieceOuverte, setPieceOuverte] = useState(null);

  return (
    <div className="detail-ensemble">
      <h2 className="detail-ensemble__nom">{ensemble.nom}</h2>

      {ensemble.bonusSpecial && (
        <div className="detail-ensemble__bonus-special">
          <strong>Bonus spécial ({ensemble.bonusSpecial.seuil} pièces)</strong>
          <p>{ensemble.bonusSpecial.texte}</p>
        </div>
      )}

      <div className="detail-ensemble__paliers">
        {paliersAvecBonus.map((palier) => (
          <div key={palier.items} className="detail-ensemble__palier">
            <p className="detail-ensemble__palier-titre">
              {palier.items} pièce{palier.items > 1 ? 's' : ''}
            </p>
            <BonusPalier delta={palier.delta} />
          </div>
        ))}
      </div>

      {pieces.length > 0 && (
        <>
          <h3 className="detail-ensemble__sous-titre">Pièces de l'ensemble</h3>
          <div className="detail-ensemble__pieces">
            {pieces.map((piece) => (
              <button
                key={piece.cle}
                type="button"
                className="detail-ensemble__piece"
                style={{ '--bordure-piece': piece.type === 'sort' ? couleurRangMaitrise(piece.rang) : undefined }}
                onClick={() => setPieceOuverte(piece)}
              >
                <div className="detail-ensemble__piece-image">
                  {piece.image ? (
                    <img src={piece.image} alt={piece.nom} loading="lazy" />
                  ) : (
                    <div className="detail-ensemble__piece-placeholder" aria-hidden="true" />
                  )}
                </div>
                <div className="detail-ensemble__piece-texte">
                  <p className="detail-ensemble__piece-nom">{piece.nom}</p>
                  <p className="detail-ensemble__piece-rang">{piece.rang}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {pieceOuverte && <PieceModal piece={pieceOuverte} perso={perso} onClose={() => setPieceOuverte(null)} />}
    </div>
  );
}

export default EnsembleDetail;
