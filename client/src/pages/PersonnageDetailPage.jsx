import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  obtenirPersonnage,
  equiperCube,
  equiperSort,
  equiperBreloque,
  renommerPersonnage,
  desequiperTout,
  supprimerPersonnage,
} from '../api/personnages';
import { obtenirCube } from '../api/cubes';
import { useAuth } from '../context/AuthContext';
import { couleurRangCube } from '../constants/rangs';
import { couleurRangMaitrise } from '../constants/rangsMaitrise';
import EmplacementSlot from '../components/EmplacementSlot';
import StatsPersonnage from '../components/StatsPersonnage';
import PanopliesPersonnage from '../components/PanopliesPersonnage';
import EnsemblesPersonnage from '../components/EnsemblesPersonnage';
import OngletSorts from '../components/OngletSorts';
import OngletBoosts from '../components/OngletBoosts';
import Modal from '../components/Modal';
import CubeCard from '../components/CubeCard';
import SortCard from '../components/SortCard';
import BreloqueCard from '../components/BreloqueCard';
import './PersonnageDetailPage.css';

const BREUVAGES_VIDES = [1, 2, 3];

// Une fonction d'équipement par type + la clé correspondante dans la réponse de
// GET /api/personnages/:id (cubes[].cube, sorts[].sort, breloques[].breloque).
const EQUIPER_PAR_TYPE = { cube: equiperCube, sort: equiperSort, breloque: equiperBreloque };
const CHEMIN_PAR_TYPE = { cube: 'cubes', sort: 'sorts', breloque: 'breloques' };

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
  const [renommage, setRenommage] = useState(false);
  const [nouveauNom, setNouveauNom] = useState('');
  const [erreurRenommage, setErreurRenommage] = useState(null);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [desequipementOuvert, setDesequipementOuvert] = useState(false);
  const [desequipementEnCours, setDesequipementEnCours] = useState(false);

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
    // Discord (et les autres bots d'aperçu) mettent l'embed en cache indéfiniment
    // pour une URL donnée, sans jamais revérifier son contenu ensuite — un
    // segment qui change à chaque copie force un aperçu neuf à chaque partage,
    // même si le stuff a déjà été partagé avec ce lien par le passé. Un simple
    // paramètre ?v=... ne suffisait pas : Discord semble l'ignorer pour décider
    // si une URL a déjà été vue — un segment de chemin, lui, change forcément
    // l'URL complète (voir App.jsx et server/routes/partageOg.js).
    const url = `${window.location.origin}/partage/${personnage.lienPartage}/${Date.now()}`;
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
      // Refetch complet plutôt qu'un patch local de l'emplacement seul : les stats/
      // panoplies/ensembles actifs/dégâts dépendent de l'équipement dans son ensemble
      // (ex: déséquiper une pièce d'un ensemble peut faire retomber son palier) et ne
      // se recalculent que côté serveur — même principe que Parcho/Boosts breloques
      // (onParchoSauvegarde/onSauvegarde), qui rafraîchissent déjà toute la fiche.
      await rafraichir();
      setModale(null);
    } catch {
      setErreurAction('Impossible de déséquiper cet item.');
    }
  }

  function ouvrirRenommage() {
    setNouveauNom(personnage.nom);
    setErreurRenommage(null);
    setRenommage(true);
  }

  async function validerRenommage(e) {
    e.preventDefault();
    try {
      const { nom } = await renommerPersonnage(session.token, id, nouveauNom);
      setPersonnage((p) => ({ ...p, nom }));
      setRenommage(false);
    } catch (err) {
      setErreurRenommage(err.message);
    }
  }

  async function confirmerToutDesequiper() {
    setDesequipementEnCours(true);
    setErreurAction(null);
    try {
      setPersonnage(await desequiperTout(session.token, id));
      setDesequipementOuvert(false);
    } catch {
      setErreurAction('Impossible de tout déséquiper.');
    } finally {
      setDesequipementEnCours(false);
    }
  }

  async function confirmerSuppression() {
    setSuppressionEnCours(true);
    try {
      await supprimerPersonnage(session.token, id);
      navigate('/personnage');
    } catch {
      setErreurAction('Impossible de supprimer ce personnage.');
      setSuppressionEnCours(false);
      setSuppressionOuverte(false);
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
      {renommage ? (
        <form className="page-personnage-detail__form-renommage" onSubmit={validerRenommage}>
          <input
            type="text"
            value={nouveauNom}
            onChange={(e) => setNouveauNom(e.target.value)}
            maxLength={100}
            autoFocus
          />
          <button type="submit">Valider</button>
          <button type="button" onClick={() => setRenommage(false)}>
            Annuler
          </button>
        </form>
      ) : (
        <div className="page-personnage-detail__titre">
          <h1>{personnage.nom}</h1>
          <button
            type="button"
            className="page-personnage-detail__bouton-renommer"
            onClick={ouvrirRenommage}
            aria-label="Renommer le personnage"
            title="Renommer"
          >
            ✏️
          </button>
        </div>
      )}
      {erreurRenommage && <p className="page-personnage-detail__erreur">{erreurRenommage}</p>}

      <button type="button" className="page-personnage-detail__partage" onClick={copierLienPartage}>
        {lienCopie ? 'Lien copié !' : '🔗 Copier le lien de partage'}
      </button>

      <div className="page-personnage-detail__actions-perso">
        <button type="button" onClick={() => setDesequipementOuvert(true)}>
          Tout déséquiper
        </button>
        <button
          type="button"
          className="page-personnage-detail__bouton-supprimer"
          onClick={() => setSuppressionOuverte(true)}
          aria-label="Supprimer ce personnage"
          title="Supprimer ce personnage"
        >
          🗑️
        </button>
      </div>
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
          className={ongletActif === 'boosts' ? 'actif' : ''}
          onClick={() => setOngletActif('boosts')}
        >
          Boosts breloques
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
      ) : ongletActif === 'boosts' ? (
        <OngletBoosts
          breloques={personnage.breloques}
          token={session.token}
          personnageId={id}
          onSauvegarde={rafraichir}
        />
      ) : (
        <>
          <div className="page-personnage-detail__stuff">
            {/* Un seul conteneur flex-wrap pour cubes + breuvages + sorts, dans cet
                ordre précis : sur mobile (étroit), cubes+breuvages tiennent sur une
                ligne et sorts passe seul à la ligne suivante ; sur desktop (assez
                large), les 3 groupes tiennent sur une seule ligne, comme la maquette
                (maquetteEquipementPerso.png) qui montre cubes/sorts/breuvages côte à
                côte. Le flex-wrap gère cette bascule automatiquement, sans media
                query dédiée à la structure. */}
            <div className="page-personnage-detail__grille">
              <div className="page-personnage-detail__section page-personnage-detail__section--cubes">
                {personnage.cubes.map(({ emplacement, cube }) => (
                  <EmplacementSlot
                    key={emplacement}
                    vide={!cube}
                    libelle={cube ? `${cube.element} ${cube.numero}` : null}
                    image={cube?.image_url}
                    bordure={cube ? couleurRangCube(cube.rang) : null}
                    sansBordure
                    lien={`/cubes?perso=${id}`}
                    onClick={cube ? () => ouvrirCube(cube, emplacement) : undefined}
                    onDesequiper={cube ? () => desequiper('cube', emplacement) : undefined}
                  />
                ))}
              </div>

              <div className="page-personnage-detail__breuvages">
                {BREUVAGES_VIDES.map((n) => (
                  <EmplacementSlot key={n} vide />
                ))}
              </div>

              <div className="page-personnage-detail__section page-personnage-detail__section--sorts">
                {personnage.sorts.map(({ emplacement, sort }) => (
                  <EmplacementSlot
                    key={emplacement}
                    vide={!sort}
                    libelle={sort?.nom}
                    image={sort?.image_url}
                    bordure={sort ? couleurRangMaitrise(sort.rang_evolution) : null}
                    lien={`/sorts?perso=${id}`}
                    onClick={sort ? () => setModale({ type: 'sort', data: sort, emplacement }) : undefined}
                    onDesequiper={sort ? () => desequiper('sort', emplacement) : undefined}
                  />
                ))}
              </div>
            </div>

            <div className="page-personnage-detail__breloques">
              {personnage.breloques.map(({ emplacement, breloque }) => (
                <EmplacementSlot
                  key={emplacement}
                  vide={!breloque}
                  libelle={breloque?.nom}
                  image={breloque?.image_url}
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
          <EnsemblesPersonnage ensembles={personnage.ensemblesActifs} />
        </>
      )}

      {modale && (
        <Modal onClose={() => setModale(null)}>
          {modale.type === 'cube' && <CubeCard cube={modale.data} />}
          {modale.type === 'sort' && <SortCard sort={modale.data} />}
          {modale.type === 'breloque' && <BreloqueCard breloque={modale.data} />}
          <Link
            to={`/${CHEMIN_PAR_TYPE[modale.type]}?perso=${id}&emplacement=${modale.emplacement}`}
            className="page-personnage-detail__bouton-remplacer"
          >
            Remplacer
          </Link>
          <button
            type="button"
            className="page-personnage-detail__bouton-desequiper"
            onClick={() => desequiper(modale.type, modale.emplacement)}
          >
            Déséquiper
          </button>
        </Modal>
      )}

      {desequipementOuvert && (
        <Modal onClose={() => setDesequipementOuvert(false)}>
          <p>Déséquiper tous les cubes, sorts et breloques de ce personnage ?</p>
          <button
            type="button"
            className="page-personnage-detail__bouton-desequiper"
            onClick={confirmerToutDesequiper}
            disabled={desequipementEnCours}
          >
            {desequipementEnCours ? 'Déséquipement...' : 'Tout déséquiper'}
          </button>
          <button
            type="button"
            className="page-personnage-detail__bouton-annuler"
            onClick={() => setDesequipementOuvert(false)}
            disabled={desequipementEnCours}
          >
            Annuler
          </button>
        </Modal>
      )}

      {suppressionOuverte && (
        <Modal onClose={() => setSuppressionOuverte(false)}>
          <p>
            Supprimer définitivement <strong>{personnage.nom}</strong> ? Le stuff sauvegardé sera perdu, cette action
            est irréversible.
          </p>
          <button
            type="button"
            className="page-personnage-detail__bouton-desequiper"
            onClick={confirmerSuppression}
            disabled={suppressionEnCours}
          >
            {suppressionEnCours ? 'Suppression...' : 'Supprimer définitivement'}
          </button>
          <button
            type="button"
            className="page-personnage-detail__bouton-annuler"
            onClick={() => setSuppressionOuverte(false)}
            disabled={suppressionEnCours}
          >
            Annuler
          </button>
        </Modal>
      )}
    </div>
  );
}

export default PersonnageDetailPage;
