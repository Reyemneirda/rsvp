// Vérifie la fonction isRsvpSaved() embarquée dans index.html :
// elle ne doit renvoyer true que si le serveur confirme l'enregistrement.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const m = html.match(/function isRsvpSaved\([\s\S]*?\n {6}\}/);
assert.ok(m, "isRsvpSaved introuvable dans index.html");
const isRsvpSaved = new Function(m[0] + "; return isRsvpSaved;")();

test("accepte la confirmation JSON du script", () => {
  assert.equal(isRsvpSaved('{"result":"ok","found":false}'), true);
});

test("refuse une page HTML (accès refusé ou exception du script)", () => {
  assert.equal(isRsvpSaved("<!DOCTYPE html><html><head><title>Access denied</title></head></html>"), false);
});

test("refuse un corps qui n'est pas du JSON", () => {
  assert.equal(isRsvpSaved("not json"), false);
});

test("refuse un JSON sans result ok", () => {
  assert.equal(isRsvpSaved('{"result":"error"}'), false);
  assert.equal(isRsvpSaved('{"found":false}'), false);
});

test("refuse un corps vide ou absent", () => {
  assert.equal(isRsvpSaved(""), false);
  assert.equal(isRsvpSaved(undefined), false);
});
