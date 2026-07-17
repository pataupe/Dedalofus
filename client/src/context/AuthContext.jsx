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
