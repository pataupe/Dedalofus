'use strict';

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

let satori, Resvg;
try {
  satori = require('satori').default;
  ({ Resvg } = require('@resvg/resvg-js'));
} catch (e) {
  console.warn('[og-image] Satori/Resvg indisponible — génération désactivée:', e.message);
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

function lireImageBase64(imageUrl) {
  if (!imageUrl) return null;
  if (imageCache.has(imageUrl)) return imageCache.get(imageUrl);
  const p = path.join(__dirname, '../../client/public', imageUrl);
  try {
    const b64 = `data:image/webp;base64,${fs.readFileSync(p).toString('base64')}`;
    imageCache.set(imageUrl, b64);
    return b64;
  } catch {
    imageCache.set(imageUrl, null);
    return null;
  }
}

const COULEURS_ELEMENT = {
  Feu: '#d9534f', Eau: '#4a90d9', Terre: '#a3763f', Air: '#7fd1c8',
  Chaos: '#9b59b6', Lumière: '#e8c547', 'Meilleur élément': '#9b59b6',
};

const T = 85;
const G = 10;

function creerSlot(item) {
  const couleur = item?.element ? (COULEURS_ELEMENT[item.element] || '#6f6555') : null;
  const img64 = item ? lireImageBase64(item.image_url) : null;
  const filled = Boolean(item);

  return {
    type: 'div',
    props: {
      style: {
        width: T, height: T, borderRadius: 6, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        border: filled
          ? `2px solid ${couleur || 'rgba(212,175,55,0.5)'}`
          : '1px dashed rgba(212,175,55,0.25)',
        background: filled ? (couleur ? couleur + '33' : '#15130f') : 'transparent',
      },
      children: img64
        ? [{ type: 'img', props: { src: img64, width: T, height: T, style: { objectFit: 'cover' } } }]
        : couleur
          ? [{ type: 'div', props: { style: { width: Math.round(T * 0.45), height: Math.round(T * 0.45), borderRadius: '50%', background: couleur, opacity: 0.65 } } }]
          : []
    }
  };
}

function creerGrille(items, cols) {
  const rows = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push({
      type: 'div',
      props: {
        style: { display: 'flex', gap: G },
        children: items.slice(i, i + cols).map(creerSlot)
      }
    });
  }
  return {
    type: 'div',
    props: { style: { display: 'flex', flexDirection: 'column', gap: G }, children: rows }
  };
}

router.get('/:lienPartage', async (req, res) => {
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

    const [[cubesRows], [sortsRows], [breloquesRows]] = await Promise.all([
      db.query(`SELECT ec.emplacement, ec.cube_id, c.element, c.image_url
        FROM EquipementCube ec JOIN Equipement e ON e.id = ec.equipement_id
        LEFT JOIN \`Cube\` c ON c.id = ec.cube_id
        WHERE e.lien_partage = ? ORDER BY ec.emplacement`, [lienPartage]),
      db.query(`SELECT es.emplacement, es.sort_id, s.element, s.image_url
        FROM EquipementSort es JOIN Equipement e ON e.id = es.equipement_id
        LEFT JOIN Sort s ON s.id = es.sort_id
        WHERE e.lien_partage = ? ORDER BY es.emplacement`, [lienPartage]),
      db.query(`SELECT eb.emplacement, eb.breloque_id, b.image_url
        FROM EquipementBreloque eb JOIN Equipement e ON e.id = eb.equipement_id
        LEFT JOIN Breloque b ON b.id = eb.breloque_id
        WHERE e.lien_partage = ? ORDER BY eb.emplacement`, [lienPartage]),
    ]);

    const cubes     = cubesRows.map(r => r.cube_id ? { element: r.element, image_url: r.image_url } : null);
    const sorts     = sortsRows.map(r => r.sort_id ? { element: r.element, image_url: r.image_url } : null);
    const breloques = breloquesRows.map(r => r.breloque_id ? { image_url: r.image_url } : null);
    const breuvages = [null, null, null];

    const fontData = await obtenirPolice();

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
                alignItems: 'center', justifyContent: 'center', gap: 14,
              },
              children: [
                // Ligne cubes | sorts | breuvages
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', gap: 20, alignItems: 'flex-start' },
                    children: [
                      creerGrille(cubes, 3),
                      creerGrille(sorts, 3),
                      {
                        type: 'div',
                        props: {
                          style: { display: 'flex', flexDirection: 'column', gap: G },
                          children: breuvages.map(() => creerSlot(null))
                        }
                      }
                    ]
                  }
                },
                // Breloques 4 + 3
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', flexDirection: 'column', gap: G, alignItems: 'center' },
                    children: [
                      { type: 'div', props: { style: { display: 'flex', gap: G }, children: breloques.slice(0, 4).map(creerSlot) } },
                      { type: 'div', props: { style: { display: 'flex', gap: G }, children: breloques.slice(4).map(creerSlot) } },
                    ]
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
