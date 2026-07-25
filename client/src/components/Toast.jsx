import { Link } from 'react-router-dom';
import './Toast.css';

// Notification discrète en bas d'écran (slide up/down via la classe `visible`),
// utilisée aussi bien pour un équipement réussi (avec lien vers la fiche perso)
// que pour une erreur d'équipement (cube déjà équipé, emplacements pleins...).
// Le minuteur d'auto-fermeture est géré par l'appelant (state `visible` +
// `setTimeout` remis à zéro à chaque nouveau message).
function Toast({ visible, texte, lien, erreur }) {
  return (
    <div className={`toast ${visible ? 'toast--visible' : ''} ${erreur ? 'toast--erreur' : ''}`}>
      <span>{texte}</span>
      {lien && (
        <Link to={lien} className="toast__lien">
          Retourner à l'équipement →
        </Link>
      )}
    </div>
  );
}

export default Toast;
