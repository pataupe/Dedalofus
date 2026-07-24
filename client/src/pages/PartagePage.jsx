import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { obtenirPersonnagePartage } from '../api/personnages';
import { obtenirCube } from '../api/cubes';
import { couleurElement } from '../constants/elements';
import { couleurRangCube, lueurRangCube } from '../constants/rangs';
import { couleurRangMaitrise } from '../constants/rangsMaitrise';
import EmplacementSlot from '../components/EmplacementSlot';
import StatsPersonnage from '../components/StatsPersonnage';
import PanopliesPersonnage from '../components/PanopliesPersonnage';
import OngletSorts from '../components/OngletSorts';
import Modal from '../components/Modal';
import CubeCard from '../components/CubeCard';
import SortCard from '../components/SortCard';
import BreloqueCard from '../components/BreloqueCard';
import './PartagePage.css';

const BREUVAGES_VIDES = [1, 2, 3];

// Page publique (sans compte) affichant un stuff partagé via son lien unique,
// en lecture seule : même grille + stats + panoplies que PersonnageDetailPage,
// mais sans les actions Équiper/Déséquiper ni l'édition du Parcho — un visiteur
// ne doit pas pouvoir modifier le stuff de quelqu'un d'autre.
function PartagePage() {
  const { lienPartage } = useParams();

  const [personnage, setPersonnage] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [modale, setModale] = useState(null);
  const [ongletActif, setOngletActif] = useState('equipement');

  useEffect(() => {
    setChargement(true);
    setErreur(null);
    obtenirPersonnagePartage(lienPartage)
      .then(setPersonnage)
      .catch(() => setErreur('Ce lien de partage est introuvable ou invalide.'))
      .finally(() => setChargement(false));
  }, [lienPartage]);

  function ouvrirCube(cube) {
    setModale({ type: 'cube', data: cube });
    // Les stats ne sont pas incluses dans la fiche partagée (comme pour la fiche
    // perso privée) : récupérées à la demande via l'endpoint public existant.
    obtenirCube(cube.id).then((complet) =>
      setModale((actuelle) =>
        actuelle?.type === 'cube' && actuelle.data.id === complet.id ? { ...actuelle, data: complet } : actuelle
      )
    );
  }

  if (chargement) return <p>Chargement...</p>;
  if (erreur) return <p className="page-partage__erreur">{erreur}</p>;
  if (!personnage) return null;

  return (
    <div className="page-partage">
      <h1>{personnage.nom}</h1>
      <p className="page-partage__info">Stuff partagé — lecture seule</p>

      <div className="page-partage__onglets">
        <button
          type="button"
          className={ongletActif === 'equipement' ? 'actif' : ''}
          onClick={() => setOngletActif('equipement')}
        >
          Équipement
        </button>
        <button type="button" className={ongletActif === 'sorts' ? 'actif' : ''} onClick={() => setOngletActif('sorts')}>
          Sorts
        </button>
      </div>

      {ongletActif === 'sorts' ? (
        <OngletSorts personnage={personnage} />
      ) : (
        <>
          <div className="page-partage__stuff">
            <div className="page-partage__grille">
              <div className="page-partage__section">
                {personnage.cubes.map(({ emplacement, cube }) => (
                  <EmplacementSlot
                    key={emplacement}
                    vide={!cube}
                    libelle={cube ? `${cube.element} ${cube.numero}` : null}
                    couleur={cube ? couleurElement(cube.element) : null}
                    bordure={cube ? couleurRangCube(cube.rang) : null}
                    lueur={cube ? lueurRangCube(cube.rang) : null}
                    onClick={cube ? () => ouvrirCube(cube) : undefined}
                  />
                ))}
              </div>

              <div className="page-partage__section">
                {personnage.sorts.map(({ emplacement, sort }) => (
                  <EmplacementSlot
                    key={emplacement}
                    vide={!sort}
                    libelle={sort?.nom}
                    bordure={sort ? couleurRangMaitrise(sort.rang_evolution) : null}
                    onClick={sort ? () => setModale({ type: 'sort', data: sort }) : undefined}
                  />
                ))}
              </div>

              <div className="page-partage__breuvages">
                {BREUVAGES_VIDES.map((n) => (
                  <EmplacementSlot key={n} vide />
                ))}
              </div>
            </div>

            <div className="page-partage__breloques">
              {personnage.breloques.map(({ emplacement, breloque }) => (
                <EmplacementSlot
                  key={emplacement}
                  vide={!breloque}
                  libelle={breloque?.nom}
                  bordure={breloque ? couleurRangMaitrise(breloque.rang) : null}
                  onClick={breloque ? () => setModale({ type: 'breloque', data: breloque }) : undefined}
                />
              ))}
            </div>
          </div>

          <StatsPersonnage stats={personnage.stats} parcho={personnage.parcho} lectureSeule />
          <PanopliesPersonnage panoplies={personnage.panoplies} />
        </>
      )}

      {modale && (
        <Modal onClose={() => setModale(null)}>
          {modale.type === 'cube' && <CubeCard cube={modale.data} />}
          {modale.type === 'sort' && <SortCard sort={modale.data} />}
          {modale.type === 'breloque' && <BreloqueCard breloque={modale.data} />}
        </Modal>
      )}
    </div>
  );
}

export default PartagePage;
