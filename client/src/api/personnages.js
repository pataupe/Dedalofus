const BASE_URL = '/api';

async function appelPersonnages(chemin, token, options = {}) {
  const reponse = await fetch(`${BASE_URL}/personnages${chemin}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    const erreur = new Error(donnees.erreur || 'Une erreur est survenue');
    erreur.code = donnees.code;
    throw erreur;
  }
  return donnees;
}

export function listerPersonnages(token) {
  return appelPersonnages('', token);
}

export function creerPersonnage(token, nom) {
  return appelPersonnages('', token, { method: 'POST', body: JSON.stringify({ nom }) });
}

export function obtenirPersonnage(token, id) {
  return appelPersonnages(`/${id}`, token);
}

export function equiperCube(token, personnageId, emplacement, cubeId) {
  return appelPersonnages(`/${personnageId}/cubes/${emplacement}`, token, {
    method: 'PUT',
    body: JSON.stringify({ cubeId }),
  });
}

export function equiperSort(token, personnageId, emplacement, sortId) {
  return appelPersonnages(`/${personnageId}/sorts/${emplacement}`, token, {
    method: 'PUT',
    body: JSON.stringify({ sortId }),
  });
}

export function equiperBreloque(token, personnageId, emplacement, breloqueId) {
  return appelPersonnages(`/${personnageId}/breloques/${emplacement}`, token, {
    method: 'PUT',
    body: JSON.stringify({ breloqueId }),
  });
}

export function equiperBreuvage(token, personnageId, emplacement, breuvageId) {
  return appelPersonnages(`/${personnageId}/breuvages/${emplacement}`, token, {
    method: 'PUT',
    body: JSON.stringify({ breuvageId }),
  });
}

// Équipe dans le premier emplacement libre du personnage (pas d'emplacement précis) :
// utilisé par le bouton "Équiper" des pages liste, pour pouvoir équiper plusieurs
// items d'affilée sans revenir sur la fiche perso entre chaque clic.
export function equiperCubeAuto(token, personnageId, cubeId) {
  return appelPersonnages(`/${personnageId}/cubes`, token, { method: 'PUT', body: JSON.stringify({ cubeId }) });
}

export function equiperSortAuto(token, personnageId, sortId) {
  return appelPersonnages(`/${personnageId}/sorts`, token, { method: 'PUT', body: JSON.stringify({ sortId }) });
}

export function equiperBreloqueAuto(token, personnageId, breloqueId) {
  return appelPersonnages(`/${personnageId}/breloques`, token, {
    method: 'PUT',
    body: JSON.stringify({ breloqueId }),
  });
}

export function equiperBreuvageAuto(token, personnageId, breuvageId) {
  return appelPersonnages(`/${personnageId}/breuvages`, token, {
    method: 'PUT',
    body: JSON.stringify({ breuvageId }),
  });
}

export function sauvegarderParcho(token, personnageId, parcho) {
  return appelPersonnages(`/${personnageId}/parcho`, token, { method: 'PUT', body: JSON.stringify(parcho) });
}

export function sauvegarderBoostBreloque(token, personnageId, emplacement, valeur) {
  return appelPersonnages(`/${personnageId}/breloques/${emplacement}/boost`, token, {
    method: 'PUT',
    body: JSON.stringify({ valeur }),
  });
}

export function renommerPersonnage(token, personnageId, nom) {
  return appelPersonnages(`/${personnageId}/nom`, token, { method: 'PUT', body: JSON.stringify({ nom }) });
}

// Vide en une fois les cubes/sorts/breloques équipés ; renvoie la fiche
// personnage complète à jour (mêmes clés que obtenirPersonnage).
export function desequiperTout(token, personnageId) {
  return appelPersonnages(`/${personnageId}/desequiper-tout`, token, { method: 'PUT' });
}

export function supprimerPersonnage(token, personnageId) {
  return appelPersonnages(`/${personnageId}`, token, { method: 'DELETE' });
}

// Route publique (sans authentification) : consultation en lecture seule d'un
// stuff partagé via son lien unique.
export async function obtenirPersonnagePartage(lienPartage) {
  const reponse = await fetch(`${BASE_URL}/partage/${lienPartage}`);
  const donnees = await reponse.json();
  if (!reponse.ok) throw new Error(donnees.erreur || 'Une erreur est survenue');
  return donnees;
}
