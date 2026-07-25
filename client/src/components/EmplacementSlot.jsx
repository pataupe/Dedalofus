import { Link } from 'react-router-dom';
import './EmplacementSlot.css';

// Représente une case de la grille d'équipement (cube/sort/breloque/breuvage).
// Vide + lien fourni -> cliquable vers la page liste correspondante pour équiper.
// Vide sans lien (breuvages, pas encore de data) -> juste affichée, inerte.
// Remplie + onClick -> ouvre la modale de détail de l'item posé.
// Remplie + onDesequiper -> petite croix dans le coin pour déséquiper directement.
// `bordure`/`lueur` : couleur de bordure par rang (bronze/argent/or/écarlate/diamant
// pour les cubes, argent/or pour les breloques et sorts), purement décoratif.
function EmplacementSlot({ vide, libelle, image, couleur, bordure, lueur, lien, onClick, onDesequiper }) {
  const style = {
    '--couleur-emplacement': couleur || undefined,
    '--couleur-bordure-rang': bordure || undefined,
    '--lueur-rang': lueur || undefined,
  };

  if (vide) {
    const classe = 'emplacement-slot emplacement-slot--vide';
    if (lien) {
      return <Link to={lien} className={classe} aria-label="Équiper cet emplacement" />;
    }
    return <div className={classe} />;
  }

  return (
    <div className="emplacement-slot-conteneur">
      <button type="button" className="emplacement-slot emplacement-slot--rempli" style={style} onClick={onClick}>
        {image ? <img src={image} alt={libelle} className="emplacement-slot__image" /> : libelle}
      </button>
      {onDesequiper && (
        <button
          type="button"
          className="emplacement-slot__croix"
          onClick={(e) => {
            e.stopPropagation();
            onDesequiper();
          }}
          aria-label="Déséquiper"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default EmplacementSlot;
