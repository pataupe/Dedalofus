import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listerPersonnages, creerPersonnage } from '../api/personnages';
import { useAuth } from '../context/AuthContext';
import { tempsRelatif } from '../utils/temps';
import './PersonnagePage.css';

function PersonnagePage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [personnages, setPersonnages] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const [nom, setNom] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreurCreation, setErreurCreation] = useState(null);

  // Page réservée aux joueurs connectés.
  useEffect(() => {
    if (!session) navigate('/connexion', { replace: true });
  }, [session, navigate]);

  useEffect(() => {
    if (!session) return;
    setChargement(true);
    setErreur(null);

    listerPersonnages(session.token)
      .then(setPersonnages)
      .catch(() => setErreur('Impossible de charger tes personnages. Le serveur est-il lancé ?'))
      .finally(() => setChargement(false));
  }, [session]);

  async function soumettre(e) {
    e.preventDefault();
    setErreurCreation(null);
    setEnvoiEnCours(true);
    try {
      const nouveau = await creerPersonnage(session.token, nom);
      navigate(`/personnage/${nouveau.id}`);
    } catch (err) {
      setErreurCreation(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  if (!session) return null;

  return (
    <div className="page-personnage">
      <h1>Mes personnages</h1>

      <form onSubmit={soumettre} className="formulaire-personnage">
        <p className="formulaire-personnage__titre">Nouveau personnage</p>
        <label>
          Nom du personnage
          <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} required />
        </label>
        {erreurCreation && <p className="formulaire-personnage__erreur">{erreurCreation}</p>}
        <button type="submit" disabled={envoiEnCours}>
          {envoiEnCours ? 'Création...' : 'Créer ce personnage'}
        </button>
      </form>

      {erreur && <p className="page-personnage__erreur">{erreur}</p>}
      {chargement && <p>Chargement...</p>}

      {!chargement && !erreur && personnages.length === 0 && (
        <p>Aucun personnage pour l'instant. Crée-en un ci-dessus.</p>
      )}

      <ul className="page-personnage__liste">
        {personnages.map((p) => (
          <li key={p.id} className="page-personnage__item">
            <Link to={`/personnage/${p.id}`}>
              <span className="page-personnage__avatar">{p.nom.charAt(0).toUpperCase()}</span>
              <span className="page-personnage__infos">
                <span className="page-personnage__nom">{p.nom}</span>
                <span className="page-personnage__meta">
                  🕒 {tempsRelatif(p.mis_a_jour_le)}
                  {p.vues_partage > 0 && ` · 👁️ ${p.vues_partage}`}
                </span>
              </span>
              <span className="page-personnage__chevron">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PersonnagePage;
