const BASE_URL = 'http://localhost:3001/api';

export async function listerBreloques({ nom = '', rangs = [], limite = 24, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (nom) params.set('nom', nom);
  if (rangs.length) params.set('rangs', rangs.join(','));
  params.set('limit', limite);
  params.set('offset', offset);

  const reponse = await fetch(`${BASE_URL}/breloques?${params}`);
  if (!reponse.ok) throw new Error('Erreur lors du chargement des breloques');
  return reponse.json();
}
