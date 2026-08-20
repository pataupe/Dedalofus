import { couleurRangMaitrise } from '../constants/rangsMaitrise';
import './EnsembleDetail.css';

// Éclate chaque pièce en une ligne par rang (Novice/Expert/Maître α/Maître ẞ), comme
// le fait touchmanager.fr — une même breloque/sort à 4 rangs différents compte comme
// 4 pièces distinctes dans ce décompte visuel.
function eclaterParRang(pieces) {
  return (pieces || []).flatMap((piece) =>
    piece.variantes.map((variante) => ({
      cle: `${piece.type}-${piece.nom}-${variante.id}`,
      nom: piece.nom,
      rang: variante.rang,
      image: variante.image_url,
    }))
  );
}

function EnsembleDetail({ ensemble }) {
  const pieces = eclaterParRang(ensemble.pieces);
  const paliersAvecBonus = (ensemble.paliers || []).filter((p) => p.texte);

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
            <p className="detail-ensemble__palier-texte">{palier.texte}</p>
          </div>
        ))}
      </div>

      {pieces.length > 0 && (
        <>
          <h3 className="detail-ensemble__sous-titre">Pièces de l'ensemble</h3>
          <div className="detail-ensemble__pieces">
            {pieces.map((piece) => (
              <div
                key={piece.cle}
                className="detail-ensemble__piece"
                style={{ '--bordure-piece': couleurRangMaitrise(piece.rang) }}
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
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default EnsembleDetail;
