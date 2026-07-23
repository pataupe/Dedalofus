import './SortCard.css';

function SortCard({ sort }) {
  const aDesDegats = sort.degats_min != null && sort.degats_max != null;
  const aDesDegatsCritiques = sort.degats_critique_min != null && sort.degats_critique_max != null;

  return (
    <div className="carte-sort">
      <div className="carte-sort__entete">{sort.nom}</div>
      <div className="carte-sort__corps">
        {(aDesDegats || aDesDegatsCritiques) && (
          <div className="carte-sort__degats">
            {aDesDegats && (
              <div className="carte-sort__degats-bloc">
                <span className="carte-sort__degats-valeur">
                  {sort.degats_min} à {sort.degats_max}
                </span>
                <span className="carte-sort__degats-libelle">Dégâts ({sort.element})</span>
              </div>
            )}
            {aDesDegatsCritiques && (
              <div className="carte-sort__degats-bloc carte-sort__degats-bloc--critique">
                <span className="carte-sort__degats-valeur">
                  {sort.degats_critique_min} à {sort.degats_critique_max}
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
          {sort.chance_critique != null && (
            <li>
              <span className="carte-sort__stat-icone" aria-hidden="true" />
              {sort.chance_critique}% critique
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
  );
}

export default SortCard;
