import './SortCard.css';

// `calcul` (optionnel) vient de calculerDegats côté serveur : quand fourni, ses
// valeurs remplacent celles de base pour l'affichage des dégâts/% critique
// (utilisé par l'onglet "Sorts" de la fiche perso). PA/Portée/Lancers ne
// changent jamais, ils ne dépendent pas du personnage. Sans `calcul` (page
// /sorts publique), comportement inchangé : dégâts et % critique de base.
function SortCard({ sort, calcul }) {
  const element = calcul?.element ?? sort.element;
  const degatsMin = calcul?.degatsMin ?? sort.degats_min;
  const degatsMax = calcul?.degatsMax ?? sort.degats_max;
  const degatsCritiqueMin = calcul?.degatsCritiqueMin ?? sort.degats_critique_min;
  const degatsCritiqueMax = calcul?.degatsCritiqueMax ?? sort.degats_critique_max;
  const chanceCritique = calcul?.chanceCritiqueTotal ?? sort.chance_critique;

  const aDesDegats = degatsMin != null && degatsMax != null;
  const aDesDegatsCritiques = degatsCritiqueMin != null && degatsCritiqueMax != null;

  return (
    <div className="carte-sort">
      <div className="carte-sort__entete">
        {sort.nom} — {sort.rang_evolution}
      </div>
      <div className="carte-sort__corps">
        <div className="carte-sort__image">
          {sort.image_url ? (
            <img src={sort.image_url} alt="" />
          ) : (
            <div className="carte-sort__image-placeholder" aria-hidden="true" />
          )}
        </div>

        <div className="carte-sort__contenu">
          {(aDesDegats || aDesDegatsCritiques) && (
            <div className="carte-sort__degats">
              {aDesDegats && (
                <div className="carte-sort__degats-bloc">
                  <span className="carte-sort__degats-valeur">
                    {degatsMin} à {degatsMax}
                  </span>
                  <span className="carte-sort__degats-libelle">Dégâts ({element})</span>
                </div>
              )}
              {aDesDegatsCritiques && (
                <div className="carte-sort__degats-bloc carte-sort__degats-bloc--critique">
                  <span className="carte-sort__degats-valeur">
                    {degatsCritiqueMin} à {degatsCritiqueMax}
                  </span>
                  <span className="carte-sort__degats-libelle">Critique</span>
                </div>
              )}
            </div>
          )}

          <ul className="carte-sort__stats">
            <li>
              <span className="carte-sort__stat-icone" aria-hidden="true" />
              {sort.cout_pa} PA
            </li>
            {sort.portee_min != null && sort.portee_max != null && (
              <li>
                <span className="carte-sort__stat-icone" aria-hidden="true" />
                Portée {sort.portee_min} à {sort.portee_max}
              </li>
            )}
            {chanceCritique != null && (
              <li>
                <span className="carte-sort__stat-icone" aria-hidden="true" />
                {chanceCritique}% critique
              </li>
            )}
            {sort.lancers_par_tour && (
              <li>
                <span className="carte-sort__stat-icone" aria-hidden="true" />
                {sort.lancers_par_tour} / tour
              </li>
            )}
            {sort.lancers_par_cible && (
              <li>
                <span className="carte-sort__stat-icone" aria-hidden="true" />
                {sort.lancers_par_cible} / cible
              </li>
            )}
          </ul>

          {sort.description && <p className="carte-sort__description">{sort.description}</p>}
        </div>
      </div>
    </div>
  );
}

export default SortCard;
