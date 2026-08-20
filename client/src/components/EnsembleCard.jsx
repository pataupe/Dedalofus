import './EnsembleCard.css';

function nombrePiecesEclatees(ensemble) {
  return (ensemble.pieces || []).reduce((total, piece) => total + piece.variantes.length, 0);
}

// Card cliquable, aperçu tronqué seulement (image composite - liste de pièces -
// liste de bonus) : le détail complet est dans la modale (EnsembleDetail), ouverte
// par le parent (EnsembleListPage/EnsembleLien) au clic.
function EnsembleCard({ ensemble, onClick }) {
  const pieces = ensemble.pieces || [];
  const paliers = (ensemble.paliers || []).filter((p) => p.texte);
  const nomsApercu = pieces.slice(0, 3).map((p) => p.nom);
  const bonusApercu = paliers.slice(0, 2).map((p) => p.texte);
  const nbPieces = nombrePiecesEclatees(ensemble);

  return (
    <button type="button" className="carte-ensemble" onClick={onClick}>
      <div className="carte-ensemble__image">
        {ensemble.imageComposite ? (
          <img src={ensemble.imageComposite} alt={ensemble.nom} loading="lazy" />
        ) : (
          <div className="carte-ensemble__placeholder" aria-hidden="true" />
        )}
      </div>

      <div className="carte-ensemble__corps">
        <p className="carte-ensemble__nom">{ensemble.nom}</p>
        {nbPieces > 0 && <p className="carte-ensemble__nb-pieces">{nbPieces} pièces</p>}

        {nomsApercu.length > 0 && (
          <p className="carte-ensemble__apercu-pieces">
            {nomsApercu.join(', ')}
            {pieces.length > nomsApercu.length && '…'}
          </p>
        )}

        {bonusApercu.length > 0 && (
          <p className="carte-ensemble__apercu-bonus">
            {bonusApercu.join(' · ')}
            {paliers.length > bonusApercu.length && '…'}
          </p>
        )}
      </div>
    </button>
  );
}

export default EnsembleCard;
