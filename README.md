# Site RSVP — Mariage Adrien & Alina

Site web dédié au RSVP, inspiré du style « Sharon & Lucas » (bleu marine + crème,
police Niconne), avec sections : cérémonie, hébergement, confirmation de présence,
page cadeau et footer.

- **Multilingue** : FR / EN / HE (RTL) / RU — détection auto du navigateur
- **Backend** : utilise **le même Google Sheet** que le save-the-date.
  Le formulaire poste vers `APPS_SCRIPT_URL` et remplit `Sheet1` (colonnes A→N).
- **Musique**, **compte à rebours**, **carte + Waze/Google Maps**.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page principale (hero, cérémonie, hébergement, RSVP, cadeau, footer) |
| `cadeau.html` | Page « Participation au cadeau » (coordonnées bancaires) |
| `apps-script.js` | Backend Google Apps Script (identique au save-the-date) |
| `music.mp3` | Musique de fond |

## ✏️ À compléter avant publication

Cherche `[À COMPLÉTER]` dans `index.html` et `cadeau.html` :

- **Hôtels / locations** recommandés (section Hébergement, `index.html`)
- **Contacts** et **réseaux sociaux** (footer, `index.html`)
- **Coordonnées bancaires** : bénéficiaire, IBAN, BIC/SWIFT, banque (`cadeau.html`)

Le formulaire RSVP est déjà branché sur votre Sheet existant — rien à changer
côté backend (sauf si vous redéployez l'Apps Script : mettez à jour `APPS_SCRIPT_URL`
dans `index.html`).

## 🚀 Publier comme nouveau repo GitHub Pages

Ce dossier est **autonome**. Pour en faire un repo dédié + GitHub Pages :

```bash
# 1. Copie ce dossier ailleurs
cp -r rsvp ~/rsvp-mariage && cd ~/rsvp-mariage

# 2. Nouveau dépôt git
git init -b main
git add .
git commit -m "Site RSVP mariage Adrien & Alina"

# 3. Crée un repo vide sur github.com (ex: rsvp-mariage), puis :
git remote add origin https://github.com/reyemneirda/rsvp-mariage.git
git push -u origin main
```

Puis sur GitHub : **Settings → Pages → Source : `main` / root → Save**.
Le site sera en ligne sur `https://reyemneirda.github.io/rsvp-mariage/`.

> Astuce : pour un test rapide en local, `python3 -m http.server` dans ce dossier
> puis ouvre http://localhost:8000.
