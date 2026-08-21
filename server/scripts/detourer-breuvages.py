# Détoure les breuvages (fond + cadre -> transparent) via rembg (IA de
# segmentation locale, modèle "bria-rmbg" — pas d'upload vers un service
# tiers). À exécuter APRÈS server/scripts/nettoyer-barre-breuvages.js (qui
# retire la barre rouge d'UI accidentellement capturée en haut de chaque
# screenshot) : le flood-fill par couleur utilisé pour cubes/breloques/sorts
# ne convient pas ici — ce style d'icône a des dégradés/lueurs trop
# progressifs vers le fond, un simple test de couleur finit par manger une
# partie du breuvage lui-même (vérifié sur le coeur rouge et la chope rouge).
#
# Installation (une fois) : python -m pip install --user rembg[cpu]
# (télécharge un modèle ~1 Go au premier lancement, mis en cache dans
# ~/.rembg/models — les lancements suivants sont rapides)
#
# Usage : python server/scripts/detourer-breuvages.py
# Rejouable (écrase juste le dossier de sortie).
#
# ⚠️ 3 images ont un artefact indépendant de la barre rouge (une fine ligne
# colorée traversant l'icône, probablement un reste de sélection/annotation
# de l'outil de capture utilisé) : rembg ne l'enlève pas puisqu'elle est
# "collée" au sujet détecté, pas au fond. Repérées lors de la session du
# 2026-08-21 : Capture d'écran 2026-08-21 152809.png (ligne bleue),
# 152834.png (ligne blanche), 152917.png (ligne violette) — à corriger à la
# main (ex: tampon de duplication) si de nouvelles captures ont le même souci.

import os
from rembg import remove, new_session
from PIL import Image
import io

DOSSIER_SRC = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'images', 'breuvages-sans-barre')
DOSSIER_SORTIE = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'images', 'breuvages-final')

def main():
    os.makedirs(DOSSIER_SORTIE, exist_ok=True)
    session = new_session("bria-rmbg")
    fichiers = sorted(f for f in os.listdir(DOSSIER_SRC) if f.lower().endswith('.png'))
    for fn in fichiers:
        with open(os.path.join(DOSSIER_SRC, fn), 'rb') as f:
            detoure = remove(f.read(), session=session)
        img = Image.open(io.BytesIO(detoure)).convert('RGBA')
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
        img.save(os.path.join(DOSSIER_SORTIE, fn))
        print(fn, '-> OK', img.size)
    print(f"\n{len(fichiers)} images traitées -> {DOSSIER_SORTIE}")

if __name__ == '__main__':
    main()
