import { useState } from 'react';
import './MonstreDetail.css';

// navigator.clipboard n'existe pas sur tous les navigateurs mobiles (ou est
// bloqué selon le contexte) : y accéder directement (comme sur PersonnageDetailPage)
// plante avant même d'atteindre le .then(), donc aucun message d'erreur ne
// s'affichait — juste "le bouton ne fait rien" sur les appareils concernés.
// Repli sur l'ancienne méthode (textarea invisible + execCommand) si l'API
// moderne est absente ou échoue.
function copierTexte(texte) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(texte);
  }

  return new Promise((resolve, reject) => {
    const zone = document.createElement('textarea');
    zone.value = texte;
    zone.style.position = 'fixed';
    zone.style.opacity = '0';
    document.body.appendChild(zone);
    zone.focus();
    zone.select();
    try {
      const succes = document.execCommand('copy');
      document.body.removeChild(zone);
      if (succes) resolve();
      else reject(new Error('execCommand a échoué'));
    } catch (err) {
      document.body.removeChild(zone);
      reject(err);
    }
  });
}

function MonstreDetail({ monstre, famille }) {
  const [lienCopie, setLienCopie] = useState(false);
  const [erreurPartage, setErreurPartage] = useState(null);
  const [passifOuvert, setPassifOuvert] = useState(false);

  function partager() {
    setErreurPartage(null);
    const url = `${window.location.origin}/monstre/${monstre.slug}`;
    copierTexte(url).then(
      () => {
        setLienCopie(true);
        setTimeout(() => setLienCopie(false), 2000);
      },
      () => setErreurPartage('Impossible de copier le lien (accès au presse-papier refusé par le navigateur).')
    );
  }

  return (
    <div className="detail-monstre">
      <div className="detail-monstre__entete">
        <div className="detail-monstre__image">
          {monstre.image ? (
            <img src={monstre.image} alt={monstre.nom} />
          ) : (
            <div className="detail-monstre__placeholder" aria-hidden="true" />
          )}
        </div>
        <div>
          <p className="detail-monstre__famille">{famille.nom}</p>
          <h2 className="detail-monstre__nom">
            {monstre.boss && <span className="detail-monstre__badge">BOSS</span>}
            {monstre.nom}
          </h2>
        </div>
      </div>

      <button type="button" className="detail-monstre__partage" onClick={partager}>
        {lienCopie ? 'Lien copié !' : '🔗 Copier le lien de cette fiche'}
      </button>
      {erreurPartage && <p className="detail-monstre__erreur-partage">{erreurPartage}</p>}

      {famille.passif && (
        <div className="detail-monstre__bloc detail-monstre__bloc--passif">
          <button
            type="button"
            className="detail-monstre__bloc-declencheur"
            onClick={() => setPassifOuvert((o) => !o)}
            aria-expanded={passifOuvert}
          >
            <strong>Passif de famille</strong>
            <span className="detail-monstre__bloc-indice">
              {passifOuvert ? 'Masquer' : 'Afficher'}
              <span className={`detail-monstre__bloc-fleche ${passifOuvert ? 'detail-monstre__bloc-fleche--ouvert' : ''}`}>
                ▾
              </span>
            </span>
          </button>
          <div className={`detail-monstre__bloc-repli ${passifOuvert ? 'ouvert' : ''}`}>
            <div className="detail-monstre__bloc-repli-interieur">
              <p>{famille.passif}</p>
            </div>
          </div>
        </div>
      )}

      {monstre.paragraphes.map((paragraphe, index) => {
        if (paragraphe.type === 'mecanique') {
          return (
            <div key={index} className="detail-monstre__bloc detail-monstre__bloc--mecanique">
              <strong>Mécanique</strong>
              <p>{paragraphe.texte}</p>
            </div>
          );
        }
        if (paragraphe.type === 'conseils') {
          return (
            <div key={index} className="detail-monstre__bloc detail-monstre__bloc--conseils">
              <strong>Conseils</strong>
              <p>{paragraphe.texte}</p>
            </div>
          );
        }
        return (
          <p key={index} className="detail-monstre__texte">
            {paragraphe.texte}
          </p>
        );
      })}
    </div>
  );
}

export default MonstreDetail;
