import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { obtenirPersonnage, equiperCube, equiperSort, equiperBreloque } from '../api/personnages';
import { obtenirCube } from '../api/cubes';
import { useAuth } from '../context/AuthContext';
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
import './PersonnageDetailPage.css';

const BREUVAGES_VIDES = [1, 2, 3];

// Une fonction d'équipement par type + la clé correspondante dans la réponse de
// GET /api/personnages/:id (cubes[].cube, sorts[].sort, breloques[].breloque).
const EQUIPER_PAR_TYPE = { cube: equiperCube, sort: equiperSort, breloque: equiperBreloque };
const CLE_LISTE_PAR_TYPE = { cube: 'cubes', sort: 'sorts', breloque: 'breloques' };

function PersonnageDetailPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [personnage, setPersonnage] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [erreurAction, setErreurAction] = useState(null);
  const [modale, setModale] = useState(null);
  const [ongletActif, setOngletActif] = useState('equipement');
  const [lienCopie, setLienCopie] = useState(false);

  useEffect(() => {
    if (!session) navigate('/connexion', { replace: true });
  }, [session, navigate]);

  function rafraichir() {
    return obtenirPersonnage(session.token, id).then(setPersonnage);
  }

  useEffect(() => {
    if (!session) return;
    setChargement(true);
    setErreur(null);

    rafraichir()
      .catch(() => setErreur('Impossible de charger ce personnage.'))
      .finally(() => setChargement(false));
  }, [session, id]);

  function ouvrirCube(cube, emplacement) {
    setModale({ type: 'cube', data: cube, emplacement });
    // Les stats ne sont pas incluses dans la fiche perso (évite de les charger pour
    // les 9 cubes à chaque ouverture de page) : on les récupère à la demande, comme
    // le fait déjà CubeDetailPage.
    obtenirCube(cube.id).then((complet) =>
      setModale((actuelle) =>
        actuelle?.type === 'cube' && actuelle.data.id === complet.id ? { ...actuelle, data: complet } : actuelle
      )
    );
  }

  function copierLienPartage() {
    const url = `${window.location.origin}/partage/${personnage.lienPartage}`;
    navigator.clipboard.writeText(url).then(
      () => {
        setLienCopie(true);
        setTimeout(() => setLienCopie(false), 2000);
      },
      () => setErreurAction('Impossible de copier le lien (accès au presse-papier refusé par le navigateur).')
    );
  }

  async function desequiper(type, emplacement) {
    setErreurAction(null);
    try {
      await EQUIPER_PAR_TYPE[type](session.token, id, emplacement, null);
      const cle = CLE_LISTE_PAR_TYPE[type];
      setPersonnage((p) => ({
        ...p,
        [cle]: p[cle].map((item) => (item.emplacement === emplacement ? { ...item, [type]: null } : item)),
      }));
      setModale(null);
    } catch {
      setErreurAction('Impossible de déséquiper cet item.');
    }
  }

  if (!session) return null;
  if (chargement) return <p>Chargement...</p>;
  if (erreur) return <p className="page-personnage-detail__erreur">{erreur}</p>;
  if (!personnage) return null;

  return (
    <div className="page-personnage-detail">
      <Link to="/personnage" className="page-personnage-detail__retour">
        ← Retour à mes personnages
      </Link>
      <h1>{personnage.nom}</h1>
      <button type="button" className="page-personnage-detail__partage" onClick={copierLienPartage}>
        {lienCopie ? 'Lien copié !' : '🔗 Copier le lien de partage'}
      </button>
      {erreurAction && <p className="page-personnage-detail__erreur">{erreurAction}</p>}

      <div className="page-personnage-detail__onglets">
        <button
          type="button"
          className={ongletActif === 'equipement' ? 'actif' : ''}
          onClick={() => setOngletActif('equipement')}
        >
          Équipement
        </button>
        <button
          type="button"
          className={ongletActif === 'sorts' ? 'actif' : ''}
          onClick={() => setOngletActif('sorts')}
        >
          Sorts
        </button>
      </div>

      {ongletActif === 'sorts' ? (
        <OngletSorts personnage={personnage} />
      ) : (
        <>
          <div className="page-personnage-detail__stuff">
            <div className="page-personnage-detail__grille">
              <div className="page-personnage-detail__section">
                {personnage.cubes.map(({ emplacement, cube }) => (
                  <EmplacementSlot
                    key={emplacement}
                    vide={!cube}
                    libelle={cube ? `${cube.element} ${cube.numero}` : null}
                    couleur={cube ? couleurElement(cube.element) : null}
                    bordure={cube ? couleurRangCube(cube.rang) : null}
                    lueur={cube ? lueurRangCube(cube.rang) : null}
                    lien={`/cubes?perso=${id}`}
                    onClick={cube ? () => ouvrirCube(cube, emplacement) : undefined}
                    onDesequiper={cube ? () => desequiper('cube', emplacement) : undefined}
                  />
                ))}
              </div>

              <div className="page-personnage-detail__section">
                {personnage.sorts.map(({ emplacement, sort }) => (
                  <EmplacementSlot
                    key={emplacement}
                    vide={!sort}
                    libelle={sort?.nom}
                    bordure={sort ? couleurRangMaitrise(sort.rang_evolution) : null}
                    lien={`/sorts?perso=${id}`}
                    onClick={sort ? () => setModale({ type: 'sort', data: sort, emplacement }) : undefined}
                    onDesequiper={sort ? () => desequiper('sort', emplacement) : undefined}
                  />
                ))}
              </div>

              <div className="page-personnage-detail__breuvages">
                {BREUVAGES_VIDES.map((n) => (
                  <EmplacementSlot key={n} vide />
                ))}
              </div>
            </div>

            <div className="page-personnage-detail__breloques">
              {personnage.breloques.map(({ emplacement, breloque }) => (
                <EmplacementSlot
                  key={emplacement}
                  vide={!breloque}
                  libelle={breloque?.nom}
                  bordure={breloque ? couleurRangMaitrise(breloque.rang) : null}
                  lien={`/breloques?perso=${id}`}
                  onClick={breloque ? () => setModale({ type: 'breloque', data: breloque, emplacement }) : undefined}
                  onDesequiper={breloque ? () => desequiper('breloque', emplacement) : undefined}
                />
              ))}
            </div>
          </div>

          <StatsPersonnage
            stats={personnage.stats}
            parcho={personnage.parcho}
            token={session.token}
            personnageId={id}
            onParchoSauvegarde={rafraichir}
          />
          <PanopliesPersonnage panoplies={personnage.panoplies} />
        </>
      )}

      {modale && (
        <Modal onClose={() => setModale(null)}>
          {modale.type === 'cube' && <CubeCard cube={modale.data} />}
          {modale.type === 'sort' && <SortCard sort={modale.data} />}
          {modale.type === 'breloque' && <BreloqueCard breloque={modale.data} />}
          <button
            type="button"
            className="page-personnage-detail__bouton-desequiper"
            onClick={() => desequiper(modale.type, modale.emplacement)}
          >
            Déséquiper
          </button>
        </Modal>
      )}
    </div>
  );
}

export default PersonnageDetailPage;
