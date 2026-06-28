/**
 * ============================================================
 *  APPS SCRIPT — RSVP Save the Date → Google Sheets
 * ============================================================
 *
 *  COLONNES DU SHEET :
 *  A(1):  First Name
 *  B(2):  Last Name
 *  C(3):  Guests
 *  D(4):  Phone Number
 *  E(5):  Telegram username
 *  F(6):  Comes ?            ← checkbox (true/false)
 *  G(7):  Parking lot        ← checkbox (true/false)
 *  H(8):  Email
 *  I(9):  Statut RSVP
 *  J(10): Total              ← formule, ne pas toucher
 *  K(11): Restrictions
 *  L(12): Message
 *  M(13): Date de réponse
 *  N(14): lang
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
 * doPost — Enregistre une réponse RSVP.
 *
 * Stratégie de recherche (dans l'ordre) :
 *   1. Téléphone (data.phone, col D) — le plus fiable
 *   2. Telegram username (data.tg, col E)
 *   3. Prénom + Nom normalisés (col A + B)
 *
 * → Si trouvé : met à jour la ligne existante.
 * → Sinon    : ajoute une nouvelle ligne en bas.
 *
 * Le champ "comes" détermine :
 *   - F: true ou false (checkbox)
 *   - I: "Confirmed" ou "Declined" (jamais vide → on distingue
 *        clairement "n'a pas répondu" vs "a refusé" dans le sheet)
 *   - Si false : guests = 0, parking = false
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

  var comes  = data.comes === true || data.comes === "true";
  var statut = comes ? "Confirmed" : "Declined";

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

  // 2) Repli : recherche par Prénom + Nom (normalisés)
  if (matchedRow === -1) {
    for (var j = 1; j < rows.length; j++) {
      var firstName = normalizeName(rows[j][0]);
      var lastName  = normalizeName(rows[j][1]);

      if (firstName === dataFirst && lastName === dataLast) {
        matchedRow = j;
        break;
      }
    }
  }

  if (matchedRow !== -1) {
    var row = matchedRow + 1;

    // Met à jour aussi A/B au cas où l'invité corrige son nom
    sheet.getRange(row, 1).setValue(data.firstName);                     // A: First Name
    sheet.getRange(row, 2).setValue(data.lastName);                      // B: Last Name
    sheet.getRange(row, 3).setValue(comes ? Number(data.guests) : 0);    // C: Guests
    // D (Phone) et E (Telegram) ne sont pas modifiés
    sheet.getRange(row, 6).setValue(comes);                              // F: Comes? (checkbox)
    sheet.getRange(row, 7).setValue(comes ? !!data.parking : false);     // G: Parking (checkbox)
    sheet.getRange(row, 8).setValue(data.email);                         // H: Email
    sheet.getRange(row, 9).setValue(statut);                             // I: Statut RSVP
    // J(10) = Total → formule, on ne touche pas
    sheet.getRange(row, 11).setValue(data.restrictions || "");           // K: Restrictions
    sheet.getRange(row, 12).setValue(data.message || "");                // L: Message
    sheet.getRange(row, 13).setValue(new Date());                        // M: Date de réponse
    sheet.getRange(row, 14).setValue(data.lang || "");                   // N: lang

    found = true;
  } else {
    sheet.appendRow([
      data.firstName,                        // A
      data.lastName,                         // B
      comes ? Number(data.guests) : 0,       // C
      data.phone || "",                      // D: Phone (utile si nouvelle ligne)
      data.tg || "",                         // E: Telegram
      comes,                                 // F: Comes? (checkbox)
      comes ? !!data.parking : false,        // G: Parking (checkbox)
      data.email,                            // H: Email
      statut,                                // I: Statut RSVP
      "",                                    // J: Total (formule)
      data.restrictions || "",               // K: Restrictions
      data.message || "",                    // L: Message
      new Date(),                            // M: Date de réponse
      data.lang || ""                        // N: lang
    ]);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ result: "ok", found: found }))
    .setMimeType(ContentService.MimeType.JSON);
}
