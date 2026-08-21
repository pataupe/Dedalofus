import { Link } from 'react-router-dom';
import './EmplacementSlot.css';

// Représente une case de la grille d'équipement (cube/sort/breloque/breuvage).
// Vide + lien fourni -> cliquable vers la page liste correspondante pour équiper.
// Vide sans lien (breuvages, pas encore de data) -> juste affichée, inerte.
// Remplie + onClick -> ouvre la modale de détail de l'item posé.
// Remplie + onDesequiper -> petite croix dans le coin pour déséquiper directement.
// `bordure` : couleur de bordure par rang (bronze/argent/or/écarlate/diamant
// pour les cubes, argent/or pour les breloques et sorts), purement décoratif.
// `sansBordure` : masque cette bordure de rang (utilisé pour les cubes et les
// breuvages, qui ont une vraie image — la bordure colorée par rang reste utile
// pour sorts/breloques, qui n'ont pas cette distinction visuelle par ailleurs).
// `imagePetite` : les images de breuvages sont détourées au plus près (pas de
// marge intégrée comme sorts/breloques), le zoom `scale(1.35)` par défaut les
// fait déborder de la case — utilise une échelle réduite à la place.
function EmplacementSlot({ vide, libelle, image, bordure, sansBordure, imagePetite, lien, onClick, onDesequiper }) {
  const style = { '--couleur-bordure-rang': bordure || undefined };
  const classeRempli = `emplacement-slot emplacement-slot--rempli${sansBordure ? ' emplacement-slot--sans-bordure' : ''}`;
  const classeImage = `emplacement-slot__image${imagePetite ? ' emplacement-slot__image--petite' : ''}`;

  if (vide) {
    const classe = 'emplacement-slot emplacement-slot--vide';
    if (lien) {
      return <Link to={lien} className={classe} aria-label="Équiper cet emplacement" />;
    }
    return <div className={classe} />;
  }

  return (
    <div className="emplacement-slot-conteneur">
      <button type="button" className={classeRempli} style={style} onClick={onClick}>
        {image ? <img src={image} alt={libelle} className={classeImage} /> : libelle}
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
