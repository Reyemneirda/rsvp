// Vérifie les helpers purs d'apps-script.js : reconnaissance de la ligne
// « Total » (même écrite **Total**) et choix de la ligne où écrire un
// nouvel invité (première ligne libre au-dessus de Total).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "..", "apps-script.js"), "utf8");
const { normalizeName, findTotalRow, findFirstFreeRow } = new Function(
  src + "; return { normalizeName, findTotalRow, findFirstFreeRow: typeof findFirstFreeRow === 'function' ? findFirstFreeRow : undefined };"
)();

const header = ["First Name", "Last Name", "Guests", "Phone", "Telegram"];
const guest = (a, b) => [a, b, 0, "", ""];
const blank = () => ["", "", "", "", ""];

test("findTotalRow reconnaît « Total » écrit avec des astérisques", () => {
  const rows = [header, guest("Anna", "B"), blank(), ["**Total**", "invited", 200, "", ""]];
  assert.equal(findTotalRow(rows), 4);
});

test("findTotalRow reconnaît toujours « Total » sans astérisques", () => {
  const rows = [header, guest("Anna", "B"), ["Total", "", "", "", ""]];
  assert.equal(findTotalRow(rows), 3);
});

test("normalizeName ne confond pas un invité avec la ligne Total", () => {
  assert.notEqual(normalizeName("Totalia"), "total");
});

test("findFirstFreeRow renvoie la première ligne vide (A→E) au-dessus de Total", () => {
  const rows = [header, guest("Anna", "B"), guest("Lev", "G"), blank(), blank(), ["**Total**", "", "", "", ""]];
  assert.equal(findFirstFreeRow(rows, 6), 4);
});

test("findFirstFreeRow ignore une ligne sans nom mais avec un téléphone", () => {
  const rows = [header, guest("Anna", "B"), ["", "", "", "972501234567", ""], blank(), ["**Total**", "", "", "", ""]];
  assert.equal(findFirstFreeRow(rows, 5), 4);
});

test("findFirstFreeRow renvoie -1 s'il n'y a aucune ligne libre avant Total", () => {
  const rows = [header, guest("Anna", "B"), ["**Total**", "", "", "", ""]];
  assert.equal(findFirstFreeRow(rows, 3), -1);
});
