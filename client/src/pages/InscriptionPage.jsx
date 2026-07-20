import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { inscrire } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import './FormulaireAuth.css';

function InscriptionPage() {
  const [email, setEmail] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const { session, connecterSession } = useAuth();
  const navigate = useNavigate();

  // Déjà connecté : pas de sens à réafficher le formulaire d'inscription.
  useEffect(() => {
    if (session) navigate('/personnage', { replace: true });
  }, [session, navigate]);

  async function soumettre(e) {
    e.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      const { token, utilisateur } = await inscrire(email, pseudo, motDePasse);
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
      <h1>Créer un compte</h1>
      <form onSubmit={soumettre} className="formulaire-auth">
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Pseudo (3 à 32 caractères)
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            minLength={3}
            maxLength={32}
            required
          />
        </label>
        <label>
          Mot de passe (6 caractères minimum)
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            minLength={6}
            required
          />
        </label>
        {erreur && <p className="formulaire-auth__erreur">{erreur}</p>}
        <button type="submit" disabled={envoiEnCours}>
          {envoiEnCours ? 'Création...' : 'Créer mon compte'}
        </button>
      </form>
      <p className="page-auth__lien">
        Déjà un compte ? <Link to="/connexion">Se connecter</Link>
      </p>
    </div>
  );
}

export default InscriptionPage;
