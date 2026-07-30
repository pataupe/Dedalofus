import { Link } from 'react-router-dom';
import './LienRetourFiche.css';

// Affiché sur les pages liste (Cubes/Sorts/Breloques) quand on y arrive depuis
// la fiche perso (`?perso=<id>`) : jusqu'ici, revenir à la fiche nécessitait
// soit d'attendre le Toast de 3s après un équipement, soit le bouton précédent
// du navigateur — ce lien reste affiché en permanence pendant toute la
// navigation dans la liste, indépendamment du Toast.
function LienRetourFiche({ perso, visible }) {
  if (!visible) return null;

  return (
    <Link to={`/personnage/${perso}`} className="lien-retour-fiche">
      ← Retour à ma fiche
    </Link>
  );
}

export default LienRetourFiche;
