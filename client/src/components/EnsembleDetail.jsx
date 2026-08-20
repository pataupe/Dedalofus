import { couleurRangMaitrise } from '../constants/rangsMaitrise';
import { ICONES_ENSEMBLES, ICONES_MULTIPLICATEURS } from '../constants/iconesEnsembles';
import './EnsembleDetail.css';

// Une ligne par stat (jamais regroupées, ex: "Retrait PA/PM" devient 2 lignes
// distinctes) — même convention visuelle que StatsPersonnage.jsx (icône ronde
// colorée + valeur alignée à droite + libellé), et mêmes libellés/icônes
// (client/src/constants/iconesEnsembles.js, tenu synchronisé avec StatsPersonnage.jsx).
function LigneBonus({ icone, couleur, libelle, valeur }) {
  return (
    <li className="detail-ensemble__stat-ligne">
      <span className="detail-ensemble__stat-valeur">{valeur}</span>
      <span className="detail-ensemble__stat-icone" style={{ background: couleur }}>
        {icone}
      </span>
      <span className="detail-ensemble__stat-libelle">{libelle}</span>
    </li>
  );
}

function formaterDelta(valeur) {
  return valeur >= 0 ? `+${valeur}` : `${valeur}`;
}

// Rend le detail d'un palier à partir du delta structuré (pas du texte brut) : une
// ligne par clé de statsPlates (déjà séparées, ex: RETRAIT_PA_BRELOQUE et
// RETRAIT_PM_BRELOQUE sont 2 clés distinctes), une ligne par multiplicateur, puis les
// notes textuelles (ex: "5% de résistances distances", "Aucun bonus" — indicatif ou
// non reconnu, jamais silencieusement perdu).
function BonusPalier({ delta }) {
  const statsEntries = Object.entries(delta?.statsPlates || {});
  const multiplicateurs = delta?.multiplicateurs || [];
  const notes = delta?.notes || [];

  if (statsEntries.length === 0 && multiplicateurs.length === 0 && notes.length === 0) {
    return <p className="detail-ensemble__note">Aucun bonus</p>;
  }

  return (
    <ul className="detail-ensemble__stat-liste">
      {statsEntries.map(([cle, valeur]) => {
        const config = ICONES_ENSEMBLES[cle];
        if (!config) return null;
        return (
          <LigneBonus key={cle} icone={config.icone} couleur={config.couleur} libelle={config.libelle} valeur={formaterDelta(valeur)} />
        );
      })}
      {multiplicateurs.map((mult, i) => {
        const config = ICONES_MULTIPLICATEURS[mult.type];
        if (!config) return null;
        const pourcent = Math.round((mult.valeur - 1) * 100);
        return (
          <LigneBonus key={`m-${i}`} icone={config.icone} couleur={config.couleur} libelle={config.libelle} valeur={formaterDelta(pourcent) + '%'} />
        );
      })}
      {notes.map((note, i) => (
        <li key={`n-${i}`} className="detail-ensemble__note">
          {note}
        </li>
      ))}
    </ul>
  );
}

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
            <BonusPalier delta={palier.delta} />
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
