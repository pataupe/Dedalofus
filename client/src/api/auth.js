const BASE_URL = 'http://localhost:3001/api';

async function appelAuth(chemin, email, motDePasse) {
  const reponse = await fetch(`${BASE_URL}/auth/${chemin}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, motDePasse }),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) throw new Error(donnees.erreur || 'Une erreur est survenue');
  return donnees;
}

export function inscrire(email, motDePasse) {
  return appelAuth('inscription', email, motDePasse);
}

export function connecter(email, motDePasse) {
  return appelAuth('connexion', email, motDePasse);
}
