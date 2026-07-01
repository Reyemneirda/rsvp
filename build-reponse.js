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

// 1) Retire les sections du guide (accueil → visa), on garde le RSVP.
html = cut(html, '<section id="welcome"', '<section id="rsvp"');

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
  .split('href="cadeau.html"').join('href="../cadeau.html"')
  // Le bouton « guide » du message de confirmation pointe vers l'accueil (l'ancre
  // #welcome n'existe pas sur /reponse/), donc on renvoie vers la page d'accueil.
  .split('href="#welcome"').join('href="../#welcome"');

// 5b) Hero en 2 colonnes : affiche à gauche, texte à droite (desktop).
{
  const hs = html.indexOf('<section class="hero" id="hero">');
  const he = html.indexOf("</section>", hs) + "</section>".length;
  const pStart = html.indexOf('<div class="poster-frame', hs);
  const pEnd = html.indexOf("</div>", pStart) + "</div>".length;
  const poster = html.slice(pStart, pEnd).trim();
  const newHero =
    '<section class="hero" id="hero">\n' +
    '      <div class="hero-split">\n' +
    '        <div class="hero-poster">\n' +
    "          " + poster + "\n" +
    "        </div>\n" +
    '        <div class="hero-copy">\n' +
    '          <p class="hero-eyebrow" data-i18n="hero_eyebrow"></p>\n' +
    '          <p class="hero-date" data-i18n="date"></p>\n' +
    '          <p class="hero-venue" data-i18n="venue"></p>\n' +
    "        </div>\n" +
    "      </div>\n" +
    '      <div class="countdown" id="countdown"></div>\n' +
    "    </section>";
  html = html.slice(0, hs) + newHero + html.slice(he);
}

// 6) Hero compact + disposition 2 colonnes (affiche gauche / texte droite).
html = html.replace(
  "</style>",
  [
    "      /* Page /reponse/ : hero 2 colonnes, réduit pour montrer vite le formulaire */",
    "      .hero { min-height: auto !important; padding-top: 5rem; padding-bottom: 1.5rem; }",
    "      .hero-split { display: flex; align-items: center; justify-content: center; gap: 2.8rem; flex-wrap: wrap; }",
    "      .hero-poster .poster-frame { margin: 0; max-width: 300px; padding: 9px; }",
    "      .hero-copy { text-align: left; max-width: 340px; }",
    "      [dir=\"rtl\"] .hero-copy { text-align: right; }",
    "      .hero-copy .hero-eyebrow { max-width: none; margin: 0 0 1rem; font-size: 0.64rem; line-height: 1.9; }",
    "      .hero-copy .hero-date { margin: 0; font-size: 1rem; }",
    "      .hero-copy .hero-venue { margin: 0.5rem 0 0; font-size: 1.15rem; }",
    "      .countdown { display: none; }",
    "      #rsvp { padding-top: 1.5rem; }",
    "      @media (max-width: 760px) {",
    "        .hero-split { flex-direction: column; gap: 1.3rem; }",
    "        .hero-copy { text-align: center; max-width: 100%; }",
    "        .hero-poster .poster-frame { max-width: 250px; }",
    "      }",
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
