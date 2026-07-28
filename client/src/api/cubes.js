const BASE_URL = '/api';

export async function listerCubes({
  nom = '',
  element = '',
  rang = '',
  stats = [],
  limite = 40,
  offset = 0,
} = {}) {
  const params = new URLSearchParams();
  if (nom) params.set('nom', nom);
  if (element) params.set('element', element);
  if (rang) params.set('rang', rang);
  if (stats.length) params.set('stats', stats.join(','));
  params.set('limit', limite);
  params.set('offset', offset);

  const reponse = await fetch(`${BASE_URL}/cubes?${params}`);
  if (!reponse.ok) throw new Error('Erreur lors du chargement des cubes');
  return reponse.json();
}

export async function obtenirCube(id) {
  const reponse = await fetch(`${BASE_URL}/cubes/${id}`);
  if (!reponse.ok) throw new Error('Cube introuvable');
  return reponse.json();
}
