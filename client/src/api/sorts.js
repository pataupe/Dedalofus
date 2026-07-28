const BASE_URL = '/api';

export async function listerSorts({ nom = '', elements = [], rangs = [], limite = 40, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (nom) params.set('nom', nom);
  if (elements.length) params.set('elements', elements.join(','));
  if (rangs.length) params.set('rangs', rangs.join(','));
  params.set('limit', limite);
  params.set('offset', offset);

  const reponse = await fetch(`${BASE_URL}/sorts?${params}`);
  if (!reponse.ok) throw new Error('Erreur lors du chargement des sorts');
  return reponse.json();
}
