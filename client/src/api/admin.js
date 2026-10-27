import { declencherDeconnexionExpiree } from '../context/AuthContext';

const BASE_URL = '/api/admin';

async function appelAdmin(chemin, token) {
  const reponse = await fetch(`${BASE_URL}${chemin}`, { headers: { Authorization: `Bearer ${token}` } });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    if (reponse.status === 401) declencherDeconnexionExpiree();
    const erreur = new Error(donnees.erreur || 'Une erreur est survenue');
    erreur.status = reponse.status;
    throw erreur;
  }
  return donnees;
}

export function listerTousPersonnages(token) {
  return appelAdmin('/personnages', token);
}

export function obtenirPersonnageAdmin(token, id) {
  return appelAdmin(`/personnages/${id}`, token);
}
