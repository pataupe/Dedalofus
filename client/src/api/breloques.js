const BASE_URL = '/api';

export async function listerBreloques({ nom = '', rangs = [], tags = [], limite = 40, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (nom) params.set('nom', nom);
  if (rangs.length) params.set('rangs', rangs.join(','));
  if (tags.length) params.set('tags', tags.join(','));
  params.set('limit', limite);
  params.set('offset', offset);

  const reponse = await fetch(`${BASE_URL}/breloques?${params}`);
  if (!reponse.ok) throw new Error('Erreur lors du chargement des breloques');
  return reponse.json();
}
