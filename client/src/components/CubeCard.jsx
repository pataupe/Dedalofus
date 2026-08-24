import { Link } from 'react-router-dom';
import { couleurElement } from '../constants/elements';
import { trouverEnsemblesCube } from '../utils/ensembles';
import EnsembleLien from './EnsembleLien';
import IconeStat from './IconeStat';
import './CubeCard.css';

// Le libellé des stats en % commence déjà par "%" (ex: "% Résistance Feu") :
// pas d'espace entre la valeur et le libellé dans ce cas, pour avoir "6% Résistance Feu".
function formaterStat(stat) {
  const separateur = stat.label.startsWith('%') ? '' : ' ';
  return `${stat.value}${separateur}${stat.label}`;
}

// `image_url` n'est pas encore renseigné en base (V1 sans vraies images) : en
// attendant, on affiche un placeholder coloré par élément à la place de la
// vraie image du cube. `actions` (optionnel) : boutons Équiper/Remplacer/Enlever
// rendus dans le pied de la carte. `lienDetail` (optionnel, ex: `/cubes/12`) :
// enveloppe l'entête+corps dans un <Link> — SEULEMENT cette partie, jamais les
// actions, pour ne pas imbriquer un <button> dans un <a> (HTML invalide, et
// cause réelle du flash de tap bleu qui n'apparaissait que sur "Équiper" côté
// cubes — un bouton ne devrait jamais être un descendant d'un lien).
function CubeCard({ cube, actions, lienDetail }) {
  const couleur = couleurElement(cube.element);
  const ensembles = trouverEnsemblesCube(cube.element);

  const contenu = (
    <>
      <div className="carte-cube__entete">
        <h3 className="carte-cube__titre">
          {cube.nom} {cube.element} {cube.numero}
        </h3>
        <p className="carte-cube__soustitre">
          <span className="carte-cube__pastille" style={{ background: couleur }} aria-hidden="true" />
          Cube &middot; {cube.rang}
        </p>
        {ensembles.length > 0 && <EnsembleLien ensembles={ensembles} />}
      </div>

      <div className="carte-cube__corps">
        <div className="carte-cube__image">
          {cube.image_url ? (
            <img src={cube.image_url} alt={cube.nom} />
          ) : (
            <div className="carte-cube__placeholder" style={{ '--couleur-cube': couleur }} aria-hidden="true" />
          )}
        </div>
        <ul className="carte-cube__stats">
          {(cube.stats || []).map((stat) => (
            <li key={stat.key}>
              <IconeStat cle={stat.key} couleur={couleur} taille={14} />
              {formaterStat(stat)}
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  return (
    <div className="carte-cube">
      {lienDetail ? (
        <Link to={lienDetail} className="carte-cube__lien">
          {contenu}
        </Link>
      ) : (
        contenu
      )}
      {actions && <div className="carte-cube__actions">{actions}</div>}
    </div>
  );
}

export default CubeCard;
