import { useState } from 'react';
import SortCard from './SortCard';
import './OngletSorts.css';

// Affiche les sorts équipés avec leurs dégâts calculés pour ce personnage
// (personnage.degats.distance/.melee, produits par calculerDegats côté
// serveur pour les 2 modes d'attaque à l'avance — pas de rechargement au
// changement de toggle), contrairement à la page /sorts publique qui affiche
// les valeurs de base. Un sort qui tape dans 2 éléments à la fois a 2 entrées
// dans `degats` -> 2 cartes.
//
// 2 réglages locaux, non persistés (juste une préférence d'affichage) :
// - Distance/Mêlée (défaut Distance) : une attaque est toujours l'un des deux,
//   jamais les deux à la fois — détermine quels multiplicateurs de breloques
//   "finaux distance"/"finaux mêlée" comptent dans le calcul déjà fait côté
//   serveur (voir server/logic/effetsBreloques.js).
// - Dégâts de base/calculés (défaut calculés) : bascule entre les valeurs
//   brutes du sort et le résultat du calcul pour ce personnage.
function OngletSorts({ personnage }) {
  const [modeAttaque, setModeAttaque] = useState('distance');
  const [afficherCalcule, setAfficherCalcule] = useState(true);

  const sortsEquipes = personnage.sorts.filter(({ sort }) => sort);

  if (sortsEquipes.length === 0) {
    return <p className="onglet-sorts__vide">Aucun sort équipé pour l'instant.</p>;
  }

  const degatsDuMode = personnage.degats[modeAttaque];

  return (
    <div className="onglet-sorts">
      <div className="onglet-sorts__options">
        <div className="onglet-sorts__toggle" role="group" aria-label="Mode d'attaque">
          <button type="button" className={modeAttaque === 'distance' ? 'actif' : ''} onClick={() => setModeAttaque('distance')}>
            Distance
          </button>
          <button type="button" className={modeAttaque === 'melee' ? 'actif' : ''} onClick={() => setModeAttaque('melee')}>
            Mêlée
          </button>
        </div>
        <div className="onglet-sorts__toggle" role="group" aria-label="Dégâts affichés">
          <button type="button" className={!afficherCalcule ? 'actif' : ''} onClick={() => setAfficherCalcule(false)}>
            Dégâts de base
          </button>
          <button type="button" className={afficherCalcule ? 'actif' : ''} onClick={() => setAfficherCalcule(true)}>
            Dégâts calculés
          </button>
        </div>
      </div>

      <div className="onglet-sorts__grille">
        {sortsEquipes.map(({ emplacement, sort }) => {
          const calculs = afficherCalcule ? degatsDuMode.filter((d) => d.sortId === sort.id) : [];

          if (calculs.length === 0) {
            return <SortCard key={emplacement} sort={sort} />;
          }

          return calculs.map((calcul) => (
            <SortCard key={`${emplacement}-${calcul.element}`} sort={sort} calcul={calcul} />
          ));
        })}
      </div>
    </div>
  );
}

export default OngletSorts;
