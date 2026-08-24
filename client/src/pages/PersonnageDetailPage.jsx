import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  obtenirPersonnage,
  equiperCube,
  equiperSort,
  equiperBreloque,
  equiperBreuvage,
  renommerPersonnage,
  desequiperTout,
  supprimerPersonnage,
} from '../api/personnages';
import { obtenirCube } from '../api/cubes';
import { copierTexte } from '../utils/presse-papier';
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
import BreuvageCard from '../components/BreuvageCard';
import './PersonnageDetailPage.css';

// Une fonction d'équipement par type + la clé correspondante dans la réponse de
// GET /api/personnages/:id (cubes[].cube, sorts[].sort, breloques[].breloque,
// breuvages[].breuvage).
const EQUIPER_PAR_TYPE = { cube: equiperCube, sort: equiperSort, breloque: equiperBreloque, breuvage: equiperBreuvage };
const CHEMIN_PAR_TYPE = { cube: 'cubes', sort: 'sorts', breloque: 'breloques', breuvage: 'breuvages' };

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
    const url = `${window.location.origin}/partage/${personnage.lienPartage}`;
    copierTexte(url).then(
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
        ← Retour
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
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="M15 5l4 4" />
            </svg>
          </button>
        </div>
      )}
      {erreurRenommage && <p className="page-personnage-detail__erreur">{erreurRenommage}</p>}

      <button type="button" className="page-personnage-detail__partage" onClick={copierLienPartage}>
        {!lienCopie && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
            <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
          </svg>
        )}
        {lienCopie ? 'Lien copié !' : 'Copier le lien de partage'}
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
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 7h16" />
            <path d="M9 7V4h6v3" />
            <path d="M6 7l1 13h10l1-13" />
            <path d="M10 11v6M14 11v6" />
          </svg>
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
                {personnage.breuvages.map(({ emplacement, breuvage }) => (
                  <EmplacementSlot
                    key={emplacement}
                    vide={!breuvage}
                    libelle={breuvage?.nom}
                    image={breuvage?.image_url}
                    sansBordure
                    imagePetite
                    lien={`/breuvages?perso=${id}`}
                    onClick={breuvage ? () => setModale({ type: 'breuvage', data: breuvage, emplacement }) : undefined}
                    onDesequiper={breuvage ? () => desequiper('breuvage', emplacement) : undefined}
                  />
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
          {(() => {
            const actionsModale = (
              <>
                <Link
                  to={`/${CHEMIN_PAR_TYPE[modale.type]}?perso=${id}&emplacement=${modale.emplacement}`}
                  className="carte-action carte-action--fantome"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h13M17 8l-3-3M17 8l-3 3" /><path d="M20 16H7M7 16l3-3M7 16l3 3" /></svg>
                  Remplacer
                </Link>
                <button
                  type="button"
                  className="carte-action carte-action--danger"
                  onClick={() => desequiper(modale.type, modale.emplacement)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  Déséquiper
                </button>
              </>
            );
            return (
              <>
                {modale.type === 'cube' && <CubeCard cube={modale.data} actions={actionsModale} />}
                {modale.type === 'sort' && <SortCard sort={modale.data} actions={actionsModale} />}
                {modale.type === 'breloque' && <BreloqueCard breloque={modale.data} actions={actionsModale} />}
                {modale.type === 'breuvage' && <BreuvageCard breuvage={modale.data} actions={actionsModale} />}
              </>
            );
          })()}
        </Modal>
      )}

      {desequipementOuvert && (
        <Modal onClose={() => setDesequipementOuvert(false)}>
          <div className="page-personnage-detail__confirmation">
            <p>Déséquiper tous les cubes, sorts, breloques et breuvages de ce personnage ?</p>
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
          </div>
        </Modal>
      )}

      {suppressionOuverte && (
        <Modal onClose={() => setSuppressionOuverte(false)}>
          <div className="page-personnage-detail__confirmation">
            <p>
              Supprimer définitivement <strong>{personnage.nom}</strong> ? Le stuff sauvegardé sera perdu, cette
              action est irréversible.
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
          </div>
        </Modal>
      )}
    </div>
  );
}

export default PersonnageDetailPage;
