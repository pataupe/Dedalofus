'use strict';

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

let satori, Resvg, sharp;
try {
  satori = require('satori').default;
  ({ Resvg } = require('@resvg/resvg-js'));
  sharp = require('sharp');
} catch (e) {
  console.warn('[og-image] Dépendance manquante — génération désactivée:', e.message);
}

let fontCache = null;
const imageCache = new Map();
const pngCache = new Map();
const PNG_TTL = 5 * 60 * 1000;

async function obtenirPolice() {
  if (fontCache) return fontCache;
  const cssRes = await fetch(
    'https://fonts.googleapis.com/css2?family=Work+Sans:wght@600&display=swap',
    { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } }
  );
  const css = await cssRes.text();
  const match = css.match(/src:\s*url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/);
  if (!match) throw new Error('URL police Work Sans introuvable dans la réponse CSS');
  const fontRes = await fetch(match[1]);
  fontCache = await fontRes.arrayBuffer();
  return fontCache;
}

// Convertit webp → PNG avant d'embarquer en base64 (resvg ne supporte pas webp dans les SVG)
async function chargerImagesPng(urls) {
  const result = new Map();
  await Promise.all([...new Set(urls.filter(Boolean))].map(async (url) => {
    if (imageCache.has(url)) { result.set(url, imageCache.get(url)); return; }
    const p = path.join(__dirname, '../../client/public', url);
    try {
      const pngBuf = await sharp(p).png().toBuffer();
      const b64 = `data:image/png;base64,${pngBuf.toString('base64')}`;
      imageCache.set(url, b64);
      result.set(url, b64);
    } catch (e) {
      console.error('[og-image] Image illisible:', p, e.message);
      imageCache.set(url, null);
      result.set(url, null);
    }
  }));
  return result;
}

// Reprend exactement la logique de couleurRangMaitrise (client/src/constants/rangsMaitrise.js) :
// Novice n'a pas d'entrée dédiée (bordure par défaut, = --bordure), Expert argent, Maître α/ẞ or.
const COULEURS_RANG_MAITRISE = { Expert: '#C0C0C0', 'Maître α': '#D4AF37', 'Maître ẞ': '#D4AF37' };
function couleurRangMaitrise(rang) {
  return COULEURS_RANG_MAITRISE[rang] || '#6f6555'; // --bordure
}

// Mêmes couleurs que EmplacementSlot.css (bg-surface, bordure-or, bordure-or-forte) — pas
// de couleur d'élément : les cubes n'ont plus de bordure/fond teinté depuis les vraies images,
// et sorts/breloques sont colorés par rang de maîtrise (Novice/Expert/Maître), pas par élément.
const BG_SURFACE = '#15130f';
const BORDURE_VIDE = 'rgba(212, 175, 55, 0.28)';
const BORDURE_PLACEHOLDER = 'rgba(212, 175, 55, 0.6)';

const T = 85;
const G = 10;
// Léger espace entre la ligne cubes/sorts/breuvages et la ligne des 7 breloques
// (distinct de G, le gap horizontal entre icônes) — demandé explicitement plus
// petit qu'un simple `gap` uniforme sur tout le conteneur.
const GAP_VERTICAL_BRELOQUES = 6;

function creerSlot(item, images) {
  const img64 = item?.image_url ? (images.get(item.image_url) || null) : null;
  const filled = Boolean(item);
  // 'transparent' pour les cubes (posé par l'appelant) : même largeur de bordure conservée
  // pour ne pas décaler la taille de la case, comme --sans-bordure côté site.
  const bordure = item?.bordure || 'transparent';

  return {
    type: 'div',
    props: {
      style: {
        width: T, height: T, borderRadius: 6, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        border: filled ? `3px solid ${bordure}` : `1px dashed ${BORDURE_VIDE}`,
        background: filled ? BG_SURFACE : 'transparent',
      },
      children: img64
        ? [{ type: 'img', props: { src: img64, width: T, height: T, style: { objectFit: 'contain' } } }]
        : filled
          ? [{ type: 'div', props: { style: { width: Math.round(T * 0.45), height: Math.round(T * 0.45), borderRadius: '50%', background: BORDURE_PLACEHOLDER, opacity: 0.65 } } }]
          : []
    }
  };
}

function creerGrille(items, cols, images) {
  const rows = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push({
      type: 'div',
      props: {
        style: { display: 'flex', gap: G },
        children: items.slice(i, i + cols).map(item => creerSlot(item, images))
      }
    });
  }
  return {
    type: 'div',
    props: { style: { display: 'flex', flexDirection: 'column', gap: G }, children: rows }
  };
}

// :version (optionnel) sert uniquement à faire varier l'URL vue par les robots
// d'aperçu (voir partageOg.js) — jamais utilisé ici, l'image est toujours
// générée à partir du seul lienPartage.
router.get('/:lienPartage{/:version}', async (req, res) => {
  if (!satori || !Resvg) return res.status(503).send('Service indisponible');

  const { lienPartage } = req.params;

  const cached = pngCache.get(lienPartage);
  if (cached && Date.now() - cached.ts < PNG_TTL) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.send(cached.data);
  }

  try {
    const [[perso]] = await db.query(
      `SELECT p.nom FROM Personnage p
       JOIN Equipement e ON e.personnage_id = p.id
       WHERE e.lien_partage = ?`,
      [lienPartage]
    );
    if (!perso) return res.status(404).send('Introuvable');

    const [[cubesRows], [sortsRows], [breloquesRows], [breuvagesRows]] = await Promise.all([
      db.query(`SELECT ec.emplacement, ec.cube_id, c.image_url
        FROM EquipementCube ec JOIN Equipement e ON e.id = ec.equipement_id
        LEFT JOIN \`Cube\` c ON c.id = ec.cube_id
        WHERE e.lien_partage = ? ORDER BY ec.emplacement`, [lienPartage]),
      db.query(`SELECT es.emplacement, es.sort_id, s.rang_evolution, s.image_url
        FROM EquipementSort es JOIN Equipement e ON e.id = es.equipement_id
        LEFT JOIN Sort s ON s.id = es.sort_id
        WHERE e.lien_partage = ? ORDER BY es.emplacement`, [lienPartage]),
      db.query(`SELECT eb.emplacement, eb.breloque_id, b.rang, b.image_url
        FROM EquipementBreloque eb JOIN Equipement e ON e.id = eb.equipement_id
        LEFT JOIN Breloque b ON b.id = eb.breloque_id
        WHERE e.lien_partage = ? ORDER BY eb.emplacement`, [lienPartage]),
      db.query(`SELECT eb.emplacement, eb.breuvage_id, b.image_url
        FROM EquipementBreuvage eb JOIN Equipement e ON e.id = eb.equipement_id
        LEFT JOIN Breuvage b ON b.id = eb.breuvage_id
        WHERE e.lien_partage = ? ORDER BY eb.emplacement`, [lienPartage]),
    ]);

    // bordure = 'transparent' pour les cubes et les breuvages (pas de bordure de rang,
    // les vraies images suffisent — cf. EmplacementSlot--sans-bordure) ; sorts/breloques
    // gardent leur bordure colorée par rang de maîtrise, comme sur la fiche perso.
    const cubes     = cubesRows.map(r => r.cube_id ? { image_url: r.image_url, bordure: 'transparent' } : null);
    const sorts     = sortsRows.map(r => r.sort_id ? { image_url: r.image_url, bordure: couleurRangMaitrise(r.rang_evolution) } : null);
    const breloques = breloquesRows.map(r => r.breloque_id ? { image_url: r.image_url, bordure: couleurRangMaitrise(r.rang) } : null);
    const breuvages = breuvagesRows.map(r => r.breuvage_id ? { image_url: r.image_url, bordure: 'transparent' } : null);

    // Chargement des images (webp → png) et de la police en parallèle
    const toutesUrls = [...cubes, ...sorts, ...breloques, ...breuvages]
      .filter(Boolean).map(i => i.image_url);
    const [images, fontData] = await Promise.all([
      chargerImagesPng(toutesUrls),
      obtenirPolice(),
    ]);

    const element = {
      type: 'div',
      props: {
        style: {
          width: 1200, height: 630, background: '#1F1C18',
          display: 'flex', flexDirection: 'column', fontFamily: 'Work Sans',
        },
        children: [
          // Header violet
          {
            type: 'div',
            props: {
              style: {
                width: 1200, height: 64, background: '#5a3d6b', flexShrink: 0,
                display: 'flex', alignItems: 'center', padding: '0 36px', gap: 16,
              },
              children: [
                { type: 'span', props: { style: { fontSize: 22, fontWeight: 700, color: '#f4eede', letterSpacing: '0.08em', textTransform: 'uppercase' }, children: 'Dédalofus' } },
                { type: 'div', props: { style: { width: 1, height: 26, background: 'rgba(244,238,220,0.3)', flexShrink: 0 } } },
                { type: 'span', props: { style: { fontSize: 20, fontWeight: 600, color: '#f4eede', opacity: 0.9 }, children: perso.nom } },
              ]
            }
          },
          // Corps : grilles + breloques centrés
          {
            type: 'div',
            props: {
              style: {
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              },
              children: [
                // Ligne cubes | sorts | breuvages
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', gap: 20, alignItems: 'flex-start' },
                    children: [
                      creerGrille(cubes, 3, images),
                      creerGrille(sorts, 3, images),
                      {
                        type: 'div',
                        props: {
                          style: { display: 'flex', flexDirection: 'column', gap: G },
                          children: breuvages.map(b => creerSlot(b, images))
                        }
                      }
                    ]
                  }
                },
                // Breloques : les 7 sur une seule ligne (léger gap vertical avec la
                // ligne du dessus, distinct du gap horizontal G entre les icônes).
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', gap: G, marginTop: GAP_VERTICAL_BRELOQUES },
                    children: breloques.map(b => creerSlot(b, images))
                  }
                }
              ]
            }
          }
        ]
      }
    };

    const svg = await satori(element, {
      width: 1200, height: 630,
      fonts: [{ name: 'Work Sans', data: fontData, weight: 600, style: 'normal' }]
    });

    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const pngData = Buffer.from(resvg.render().asPng());

    pngCache.set(lienPartage, { data: pngData, ts: Date.now() });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(pngData);

  } catch (err) {
    console.error('[og-image] Erreur:', err);
    res.status(500).send('Erreur de génération');
  }
});

module.exports = router;
