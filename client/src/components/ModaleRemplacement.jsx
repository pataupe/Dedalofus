import Modal from './Modal';
import EmplacementSlot from './EmplacementSlot';
import { couleurElement } from '../constants/elements';
import { couleurRangCube, lueurRangCube } from '../constants/rangs';
import { couleurRangMaitrise } from '../constants/rangsMaitrise';
import './ModaleRemplacement.css';

const LIBELLES_TYPE = { cube: 'cube', sort: 'sort', breloque: 'breloque' };

function libelleItem(type, item) {
  return type === 'cube' ? `${item.element} ${item.numero}` : item.nom;
}

function bordureItem(type, item) {
  return type === 'cube' ? couleurRangCube(item.rang) : couleurRangMaitrise(item.rang ?? item.rang_evolution);
}

// Affichée quand tous les emplacements d'un type sont déjà occupés au moment
// d'équiper depuis une page liste (Cubes/Breloques/Sorts) : liste les emplacements
// actuels (tous remplis) pour que le joueur choisisse lequel remplacer par le
// nouvel item, plutôt que de simplement échouer avec une erreur.
function ModaleRemplacement({ type, emplacements, onChoisir, onClose }) {
  return (
    <Modal onClose={onClose}>
      <p className="modale-remplacement__titre">Choisissez le {LIBELLES_TYPE[type]} à remplacer :</p>
      <div className="modale-remplacement__grille">
        {emplacements.map((e) => {
          const item = e[type];
          return (
            <EmplacementSlot
              key={e.emplacement}
              vide={false}
              libelle={libelleItem(type, item)}
              image={item.image_url}
              couleur={type === 'cube' ? couleurElement(item.element) : null}
              bordure={bordureItem(type, item)}
              lueur={type === 'cube' ? lueurRangCube(item.rang) : null}
              onClick={() => onChoisir(e.emplacement)}
            />
          );
        })}
      </div>
    </Modal>
  );
}

export default ModaleRemplacement;
