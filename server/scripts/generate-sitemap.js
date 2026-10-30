// Génère client/public/sitemap.xml à partir des données réelles du site
// (jamais de nombre codé en dur) — rejouable à chaque fois que des cubes/monstres
// sont ajoutés. N'inclut que les pages publiques indexables : pas /connexion,
// /inscription, /personnage(/:id), /partage/:lienPartage ni /admin (comptes,
// stuffs privés, liens de partage individuels — aucune valeur SEO, et certains
// exposeraient des données d'un joueur précis s'ils étaient indexés).
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://dedalofus.fr';

// Pages statiques, avec une priorité indicative (0 à 1, juste un signal pour
// les moteurs de recherche, aucune garantie de classement).
const PAGES_STATIQUES = [
  { chemin: '/', priorite: '1.0' },
  { chemin: '/cubes', priorite: '0.8' },
  { chemin: '/breloques', priorite: '0.8' },
  { chemin: '/sorts', priorite: '0.8' },
  { chemin: '/breuvages', priorite: '0.8' },
  { chemin: '/ensembles', priorite: '0.8' },
  { chemin: '/monstres', priorite: '0.8' },
  { chemin: '/mentions-legales', priorite: '0.2' },
  { chemin: '/politique-de-confidentialite', priorite: '0.2' },
];

function listerIdsCubes() {
  const cubes = require('../../data/cubes_v2.json');
  return cubes.map((c) => c.id);
}

// Parcourt la hiérarchie profondeur → biome → famille → monstre de monstres.json
// pour récupérer tous les slugs, sans supposer un nombre fixe quelque part.
function listerSlugsMonstres() {
  const data = require('../../client/src/data/monstres.json');
  const slugs = [];

  function parcourir(valeur) {
    if (Array.isArray(valeur)) {
      valeur.forEach(parcourir);
      return;
    }
    if (valeur && typeof valeur === 'object') {
      if (typeof valeur.slug === 'string') slugs.push(valeur.slug);
      Object.values(valeur).forEach((v) => {
        if (v && typeof v === 'object') parcourir(v);
      });
    }
  }

  parcourir(data);
  return slugs;
}

function construireUrl(chemin, priorite) {
  return `  <url>\n    <loc>${BASE_URL}${chemin}</loc>\n    <priority>${priorite}</priority>\n  </url>`;
}

function main() {
  const urls = [];

  for (const page of PAGES_STATIQUES) {
    urls.push(construireUrl(page.chemin, page.priorite));
  }

  const idsCubes = listerIdsCubes();
  for (const id of idsCubes) {
    urls.push(construireUrl(`/cubes/${id}`, '0.5'));
  }

  const slugsMonstres = listerSlugsMonstres();
  for (const slug of slugsMonstres) {
    urls.push(construireUrl(`/monstre/${slug}`, '0.6'));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

  const cheminSortie = path.join(__dirname, '..', '..', 'client', 'public', 'sitemap.xml');
  fs.writeFileSync(cheminSortie, xml, 'utf-8');

  console.log(`Sitemap généré : ${urls.length} URLs (${PAGES_STATIQUES.length} pages statiques, ${idsCubes.length} cubes, ${slugsMonstres.length} monstres).`);
  console.log(`Écrit dans : ${cheminSortie}`);
}

main();
