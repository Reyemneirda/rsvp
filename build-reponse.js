/**
 * build-reponse.js — Génère reponse/index.html à partir de index.html.
 *
 * La page « /reponse/ » est une version ALLÉGÉE de l'accueil : uniquement
 * le formulaire RSVP (même backend, mêmes traductions, même JS). Elle sert
 * à envoyer un lien direct vers le formulaire (SMS aux invités) tant que
 * le guide pratique n'est pas terminé.
 *
 * ⚠️ Fichier GÉNÉRÉ : ne pas éditer reponse/index.html à la main.
 *    Après toute modif de index.html (formulaire, traductions…), relancer :
 *        node build-reponse.js
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "index.html");
const OUT_DIR = path.join(__dirname, "reponse");
const OUT = path.join(OUT_DIR, "index.html");

let html = fs.readFileSync(SRC, "utf8");

/** Supprime la sous-chaîne entre le début de `startNeedle` et le début de `endNeedle`. */
function cut(s, startNeedle, endNeedle) {
  const a = s.indexOf(startNeedle);
  if (a === -1) throw new Error("Marqueur introuvable: " + startNeedle);
  const b = s.indexOf(endNeedle, a);
  if (b === -1) throw new Error("Marqueur introuvable: " + endNeedle);
  return s.slice(0, a) + s.slice(b);
}

/** Comme cut(), mais retire aussi la fin de `endNeedle` (borne incluse). */
function cutIncl(s, startNeedle, endNeedle) {
  const a = s.indexOf(startNeedle);
  if (a === -1) throw new Error("Marqueur introuvable: " + startNeedle);
  const b = s.indexOf(endNeedle, a);
  if (b === -1) throw new Error("Marqueur introuvable: " + endNeedle);
  return s.slice(0, a) + s.slice(b + endNeedle.length);
}

// (L'affiche est conservée dans le hero, en format compact — voir étape 6.)

// 1) Retire les sections du guide (programme → infos pratiques), on garde le RSVP.
html = cut(html, '<section id="program"', '<section id="rsvp"');

// 2) Retire la section « Cadeau » de l'accueil (le bouton cadeau reste dans
//    le message de confirmation après envoi du formulaire).
html = cut(html, '<section id="gift"', "<footer>");

// 3) Retire les boutons d'action + l'indication de scroll du hero
//    (on garde noms, date, lieu et compte à rebours).
html = cut(html, '<div class="hero-actions">', "</section>");

// 4) Nettoie les commentaires de section orphelins.
html = html
  .split("\n")
  .filter((line) => !/^\s*<!--\s*=+\s*(PROGRAMME|LIEU|HÉBERGEMENT|INFOS PRATIQUES|CADEAU)\b/.test(line))
  .join("\n");

// 5) Corrige les chemins relatifs (la page est dans le sous-dossier /reponse/).
html = html
  .split('src="music.mp3"').join('src="../music.mp3"')
  .split('src="banner.jpeg"').join('src="../banner.jpeg"')
  .split('href="cadeau.html"').join('href="../cadeau.html"');

// 6) Hero compact (pas de plein écran : le formulaire doit être visible vite).
html = html.replace(
  "</style>",
  [
    "      /* Page /reponse/ : hero réduit pour donner la priorité au formulaire */",
    "      .hero { min-height: auto !important; padding-top: 5rem; padding-bottom: 1.2rem; }",
    "      .hero-eyebrow { font-size: 0.62rem; margin-bottom: 0.9rem; }",
    "      .poster-frame { max-width: 250px; padding: 8px; margin-top: 0.4rem; }",
    "      .hero-date { margin-top: 1rem; font-size: 0.9rem; }",
    "      .hero-venue { margin-top: 0.35rem; font-size: 1rem; margin-bottom: 0; }",
    "      .countdown { display: none; }",
    "      #rsvp { padding-top: 1.5rem; }",
    "    </style>",
  ].join("\n")
);

// 7) Titre + bannière de tête.
html = html.replace(
  "<title>Mariage Adrien & Alina</title>",
  "<title>RSVP — Mariage Adrien & Alina</title>"
);

// 8) Avertissement « fichier généré ».
html = html.replace(
  "<!doctype html>",
  "<!doctype html>\n<!-- ⚠️ FICHIER GÉNÉRÉ par build-reponse.js — ne pas éditer à la main. -->"
);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, html, "utf8");
console.log("OK → " + path.relative(__dirname, OUT) + " (" + html.length + " octets)");
