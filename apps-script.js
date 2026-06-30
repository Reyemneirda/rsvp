/**
 * ============================================================
 *  APPS SCRIPT — RSVP Save the Date → Google Sheets
 * ============================================================
 *
 *  COLONNES DU SHEET :
 *  A(1):  First Name
 *  B(2):  Last Name
 *  C(3):  Guests            ← nombre d'accompagnant·e·s (0, 1, 2…)
 *  D(4):  Phone Number
 *  E(5):  Telegram username
 *  F(6):  Comes ?            ← checkbox (true/false)
 *  G(7):  Parking lot        ← checkbox (true/false)
 *  H(8):  Email
 *  I(9):  Statut RSVP
 *  J(10): Total              ← formule =IF(F,1+C+P,0)
 *  K(11): Restrictions
 *  L(12): Message / Notes
 *  M(13): Date de réponse
 *  N(14): lang
 *  O(15): Enfants ?          ← checkbox (true/false)
 *  P(16): Nb enfants         ← nombre d'enfants (0, 1, 2…) — NOUVELLE COLONNE
 *
 *  ⚠️ Les nouvelles réponses sont insérées AVANT la ligne « Total »
 *     (résumé en bas de feuille), jamais après.
 *
 *  FONCTIONS :
 *  doGet  → Recherche par téléphone (?p=) ou Telegram (?t=)
 *  doPost → Enregistre une réponse RSVP
 *
 *  MISE À JOUR :
 *  Apps Script → Déployer > Gérer > Crayon > Nouvelle version
 *
 * ============================================================
 */


function normalizePhone(raw) {
  if (!raw) return "";
  var digits = String(raw).replace(/[^0-9]/g, "");
  if (digits.substring(0, 2) === "00") digits = digits.substring(2);
  if (digits.charAt(0) === "0") digits = digits.substring(1);
  return digits;
}


function normalizeName(raw) {
  if (!raw) return "";
  return String(raw)
    .trim()
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[-'\s]/g, "");
}


/**
 * doGet — Recherche un invité par téléphone ou Telegram username.
 *
 *   ?p=33640158915     → col D
 *   ?t=john_doe        → col E
 */
function doGet(e) {
  var phone = e.parameter.p || "";
  var tgUser = e.parameter.t || "";

  var sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("Sheet1");

  var rows = sheet.getDataRange().getDisplayValues();
  var result = { found: false };
  var normalizedSearch = normalizePhone(phone);

  for (var i = 1; i < rows.length; i++) {
    var matched = false;

    if (normalizedSearch) {
      var cellPhone = normalizePhone(rows[i][3]); // D
      if (cellPhone && cellPhone === normalizedSearch) matched = true;
    }

    if (!matched && tgUser) {
      var cellTg = String(rows[i][4] || "").trim().toLowerCase().replace(/^@/, "");
      var searchTg = tgUser.trim().toLowerCase().replace(/^@/, "");
      if (cellTg && cellTg === searchTg) matched = true;
    }

    if (matched) {
      result = {
        found: true,
        firstName: rows[i][0],         // A
        lastName:  rows[i][1],         // B
        email:     rows[i][7] || ""    // H (Email)
      };
      break;
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * Trouve l'index (1-based) de la ligne de résumé « Total » (col A = "Total").
 * Recherche depuis le bas. Retourne -1 si absente.
 */
function findTotalRow(rows) {
  for (var i = rows.length - 1; i >= 1; i--) {
    if (normalizeName(rows[i][0]) === "total") return i + 1;
  }
  return -1;
}


/**
 * doPost — Enregistre une réponse RSVP.
 *
 * Stratégie de recherche (dans l'ordre) :
 *   1. Téléphone (data.phone, col D) — le plus fiable
 *   2. Telegram username (data.tg, col E)
 *   3. Prénom + Nom normalisés (col A + B)
 *
 * → Si trouvé : met à jour la ligne existante.
 * → Sinon    : insère une nouvelle ligne AVANT la ligne « Total »
 *              (jamais après le résumé en bas de feuille).
 *
 * Champs attendus (nouveau formulaire) :
 *   comes, plusOne, children, parking (booléens), notes (texte).
 *
 * Le champ "comes" détermine :
 *   - F: true ou false (checkbox)
 *   - I: "Confirmed" ou "Declined" (jamais vide → on distingue
 *        clairement "n'a pas répondu" vs "a refusé" dans le sheet)
 *   - Si false : guests = 0, parking = false, children = false
 */
function doPost(e) {
  var sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("Sheet1");

  var data = JSON.parse(e.postData.contents);
  var rows = sheet.getDataRange().getValues();
  var found = false;
  var matchedRow = -1;

  var dataFirst = normalizeName(data.firstName);
  var dataLast  = normalizeName(data.lastName);
  var dataPhone = normalizePhone(data.phone || "");
  var dataTg    = String(data.tg || "").trim().toLowerCase().replace(/^@/, "");

  function asBool(v) { return v === true || v === "true"; }
  function asCount(v) { var n = Number(v); return n > 0 ? Math.floor(n) : 0; }
  var comes    = asBool(data.comes);
  var plusOne  = comes && asBool(data.plusOne);
  var children = comes && asBool(data.children);
  var parking  = comes && asBool(data.parking);
  // Nombre d'accompagnant·e·s : valeur saisie, sinon 1 si « oui », sinon 0
  var guests   = plusOne ? (asCount(data.plusOneCount) || asCount(data.guests) || 1) : 0;
  // Nombre d'enfants : valeur saisie, sinon 1 si « oui », sinon 0
  var nbKids   = children ? (asCount(data.childrenCount) || 1) : 0;
  var notes    = data.notes || data.message || "";
  var statut   = comes ? "Confirmed" : "Declined";

  // 1) Recherche prioritaire par téléphone ou Telegram (identifiant fort)
  if (dataPhone || dataTg) {
    for (var i = 1; i < rows.length; i++) {
      if (dataPhone) {
        var cellPhone = normalizePhone(rows[i][3]); // D
        if (cellPhone && cellPhone === dataPhone) {
          matchedRow = i;
          break;
        }
      }
      if (dataTg) {
        var cellTg = String(rows[i][4] || "").trim().toLowerCase().replace(/^@/, ""); // E
        if (cellTg && cellTg === dataTg) {
          matchedRow = i;
          break;
        }
      }
    }
  }

  // 2) Repli : recherche par Prénom + Nom (normalisés) — on ignore la ligne Total
  if (matchedRow === -1) {
    for (var j = 1; j < rows.length; j++) {
      if (normalizeName(rows[j][0]) === "total") continue;
      var firstName = normalizeName(rows[j][0]);
      var lastName  = normalizeName(rows[j][1]);

      if (firstName === dataFirst && lastName === dataLast) {
        matchedRow = j;
        break;
      }
    }
  }

  var row;
  if (matchedRow !== -1) {
    // Ligne existante : on met à jour sur place.
    row = matchedRow + 1;
    found = true;
  } else {
    // Nouvelle ligne : insérée AVANT la ligne « Total ».
    // On insère avant la dernière ligne de données (Total - 1) pour rester
    // dans la plage des formules de résumé (qui s'étendent automatiquement).
    var totalRow = findTotalRow(rows);
    if (totalRow > 2) {
      sheet.insertRowBefore(totalRow - 1);
      row = totalRow - 1;
    } else if (totalRow !== -1) {
      sheet.insertRowBefore(totalRow);
      row = totalRow;
    } else {
      row = sheet.getLastRow() + 1; // pas de ligne Total → ajout en bas
    }
    // Identifiants forts (uniquement pour une nouvelle ligne)
    sheet.getRange(row, 4).setValue(data.phone || ""); // D: Phone
    sheet.getRange(row, 5).setValue(data.tg || "");    // E: Telegram
  }

  // Champs communs (création ET mise à jour)
  sheet.getRange(row, 1).setValue(data.firstName);                 // A: First Name
  sheet.getRange(row, 2).setValue(data.lastName);                  // B: Last Name
  sheet.getRange(row, 3).setValue(guests);                         // C: Guests (accompagnants)
  sheet.getRange(row, 6).setValue(comes);                          // F: Comes? (checkbox)
  sheet.getRange(row, 7).setValue(parking);                        // G: Parking (checkbox)
  if (data.email) sheet.getRange(row, 8).setValue(data.email);     // H: Email (si fourni)
  sheet.getRange(row, 9).setValue(statut);                         // I: Statut RSVP
  sheet.getRange(row, 10).setFormula(                              // J: Total (formule)
    "=IF(F" + row + "=TRUE, 1+C" + row + "+P" + row + ", 0)");
  sheet.getRange(row, 12).setValue(notes);                         // L: Message / Notes
  sheet.getRange(row, 13).setValue(new Date());                    // M: Date de réponse
  sheet.getRange(row, 14).setValue(data.lang || "");               // N: lang
  sheet.getRange(row, 15).setValue(children);                      // O: Enfants? (checkbox)
  sheet.getRange(row, 16).setValue(nbKids);                        // P: Nb enfants
  // D/E/K ne sont pas écrasés lors d'une mise à jour ; H seulement si fourni.

  return ContentService
    .createTextOutput(JSON.stringify({ result: "ok", found: found }))
    .setMimeType(ContentService.MimeType.JSON);
}
