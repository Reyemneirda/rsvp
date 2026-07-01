# Site RSVP — Mariage Adrien & Alina

Site web dédié au RSVP, thème **affiche de cinéma vintage** (façon *Casablanca*)
tiré de `banner.jpeg` : papier crème, bleu canard, jaune doré, rouge terracotta ;
typo brush script (Yellowtail), condensé (Oswald) et serif (EB Garamond). Sections :
**programme** de la soirée, **lieu** (Beit Andromeda), **hébergement** (quartiers de
Tel Aviv-Jaffa), **infos pratiques** (transport, ETA-IL, climat/tenue),
**confirmation de présence**, **page cadeau** et footer.

Contenu repris du _Guide pratique du mariage_ (Adrien & Alina, 5 octobre 2026).

- **Multilingue** : FR / EN / HE (RTL) / RU — détection auto du navigateur
- **Backend** : utilise **le même Google Sheet** que le save-the-date.
  Le formulaire poste vers `APPS_SCRIPT_URL` et remplit `Sheet1` (colonnes A→N).
- **Musique**, **compte à rebours**, **carte + Waze/Google Maps**.
- **Coordonnées bancaires** (Europe + Israël) déjà renseignées dans `cadeau.html`.

## Fichiers

| Fichier              | Rôle                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| `index.html`         | Page principale (hero, cérémonie, hébergement, RSVP, cadeau, footer) |
| `reponse/index.html` | **Page RSVP autonome** (formulaire seul) → `…/rsvp/reponse/`. _Générée_ |
| `build-reponse.js`   | Génère `reponse/index.html` depuis `index.html` (`node build-reponse.js`) |
| `cadeau.html`        | Page « Participation au cadeau » (coordonnées bancaires)             |
| `apps-script.js`     | Backend Google Apps Script (identique au save-the-date)              |
| `banner.jpeg`        | Affiche « Tel Aviv » — hero de l'accueil + base du thème visuel      |
| `music.mp3`          | Musique de fond                                                      |

> **Lien RSVP direct** (à envoyer par SMS) : `https://reyemneirda.github.io/rsvp/reponse/`
> Cette page ne contient que le formulaire (le guide est sur l'accueil).
> ⚠️ `reponse/index.html` est **généré** : après toute modif du formulaire dans
> `index.html`, relancer `node build-reponse.js`.

## ✏️ Optionnel

Tout est déjà renseigné (lieu, programme, quartiers, contacts, coordonnées
bancaires). Si besoin :

- Ajouter vos **réseaux sociaux** (Instagram…) dans le footer de `index.html`.
- Le formulaire RSVP est déjà branché sur votre Sheet existant — rien à changer
  côté backend (sauf si vous redéployez l'Apps Script : mettez à jour
  `APPS_SCRIPT_URL` dans `index.html`).

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
