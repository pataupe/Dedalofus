import Modal from './Modal';
import EmplacementSlot from './EmplacementSlot';
import { couleurRangCube } from '../constants/rangs';
import { couleurRangMaitrise } from '../constants/rangsMaitrise';
import './ModaleRemplacement.css';

const LIBELLES_TYPE = { cube: 'cube', sort: 'sort', breloque: 'breloque', breuvage: 'breuvage' };

function libelleItem(type, item) {
  return type === 'cube' ? `${item.element} ${item.numero}` : item.nom;
}

// Breuvage (comme cube) n'affiche pas de bordure de rang, cf. sansBordure ci-dessous
// — la couleur calculée ici n'a alors aucun effet visuel (masquée par le CSS).
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
              bordure={bordureItem(type, item)}
              sansBordure={type === 'cube' || type === 'breuvage'}
              imagePetite={type === 'breuvage'}
              onClick={() => onChoisir(e.emplacement)}
            />
          );
        })}
      </div>
    </Modal>
  );
}

export default ModaleRemplacement;
