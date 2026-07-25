import './BreloqueCard.css';

function BreloqueCard({ breloque }) {
  return (
    <div className="carte-breloque">
      <div className="carte-breloque__entete">
        {breloque.nom} — {breloque.rang}
      </div>
      <div className="carte-breloque__corps">
        <div className="carte-breloque__image">
          {breloque.image_url ? (
            <img src={breloque.image_url} alt={breloque.nom} />
          ) : (
            <div className="carte-breloque__placeholder" aria-hidden="true" />
          )}
        </div>
        <p className="carte-breloque__effet">{breloque.effet}</p>
      </div>
    </div>
  );
}

export default BreloqueCard;
