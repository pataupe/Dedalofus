import './MonstreCard.css';

function MonstreCard({ monstre, onClick }) {
  const extrait = monstre.paragraphes.find((p) => p.type === 'texte');

  return (
    <button
      type="button"
      className={`carte-monstre ${monstre.boss ? 'carte-monstre--boss' : ''}`}
      onClick={onClick}
    >
      <div className="carte-monstre__image">
        {monstre.image ? (
          <img src={monstre.image} alt={monstre.nom} loading="lazy" />
        ) : (
          <div className="carte-monstre__placeholder" aria-hidden="true" />
        )}
      </div>
      <div className="carte-monstre__corps">
        <p className="carte-monstre__nom">
          {monstre.boss && <span className="carte-monstre__badge">BOSS</span>}
          {monstre.nom}
        </p>
        {extrait && <p className="carte-monstre__extrait">{extrait.texte}</p>}
      </div>
    </button>
  );
}

export default MonstreCard;
