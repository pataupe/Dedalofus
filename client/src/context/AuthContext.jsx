import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// Le token est gardé dans localStorage pour rester connecté après un
// rafraîchissement de page (pas de niveau de sécurité bancaire nécessaire ici).
function lireSessionStockee() {
  const token = localStorage.getItem('token');
  const utilisateurBrut = localStorage.getItem('utilisateur');
  if (!token || !utilisateurBrut) return null;
  return { token, utilisateur: JSON.parse(utilisateurBrut) };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(lireSessionStockee);

  function connecterSession(token, utilisateur) {
    localStorage.setItem('token', token);
    localStorage.setItem('utilisateur', JSON.stringify(utilisateur));
    setSession({ token, utilisateur });
  }

  function deconnecter() {
    localStorage.removeItem('token');
    localStorage.removeItem('utilisateur');
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, connecterSession, deconnecter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Appelée depuis les modules api/*.js (hors de l'arbre React, donc sans accès
// à useAuth) quand le serveur renvoie 401 sur une route protégée : le token
// stocké est expiré ou invalide (durée de vie 30 jours). On nettoie la session
// et on force un rechargement complet vers la connexion — plus simple et plus
// sûr qu'un appel à travers le contexte React (l'état de toute l'appli est de
// toute façon à jeter si la session n'est plus valide).
export function declencherDeconnexionExpiree() {
  localStorage.removeItem('token');
  localStorage.removeItem('utilisateur');
  window.location.href = '/connexion?expiree=1';
}
