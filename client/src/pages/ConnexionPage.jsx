import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { connecter } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import './FormulaireAuth.css';

function ConnexionPage() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const { session, connecterSession } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpiree = searchParams.get('expiree') === '1';

  // Déjà connecté : pas de sens à réafficher le formulaire de connexion.
  // (Ne s'applique pas juste après une déconnexion forcée pour token expiré :
  // declencherDeconnexionExpiree vide déjà localStorage avant la redirection,
  // donc `session` est null à ce moment-là.)
  useEffect(() => {
    if (session) navigate('/personnage', { replace: true });
  }, [session, navigate]);

  async function soumettre(e) {
    e.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      const { token, utilisateur } = await connecter(email, motDePasse);
      connecterSession(token, utilisateur);
      navigate('/');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <div className="page-auth">
      <h1>Connexion</h1>
      {sessionExpiree && (
        <p className="formulaire-auth__erreur">Ta session a expiré, reconnecte-toi.</p>
      )}
      <form onSubmit={soumettre} className="formulaire-auth">
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
          />
        </label>
        {erreur && <p className="formulaire-auth__erreur">{erreur}</p>}
        <button type="submit" disabled={envoiEnCours}>
          {envoiEnCours ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
      <p className="page-auth__lien">
        Pas encore de compte ? <Link to="/inscription">S'inscrire</Link>
      </p>
    </div>
  );
}

export default ConnexionPage;
