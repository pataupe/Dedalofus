const BASE_URL = '/api';

export async function listerBreuvages({ nom = '', rangs = [], limite = 40, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (nom) params.set('nom', nom);
  if (rangs.length) params.set('rangs', rangs.join(','));
  params.set('limit', limite);
  params.set('offset', offset);

  const reponse = await fetch(`${BASE_URL}/breuvages?${params}`);
  if (!reponse.ok) throw new Error('Erreur lors du chargement des breuvages');
  return reponse.json();
}
