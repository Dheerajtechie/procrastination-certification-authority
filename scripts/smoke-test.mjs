import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import assert from "node:assert/strict";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(html, /<!doctype html>/i, "index.html must start with a doctype");
assert.match(html, /<html[^>]+lang=/i, "document language must be declared");
assert.match(html, /<meta[^>]+name=["']viewport["']/i, "responsive viewport meta is required");

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]);
const uniqueIds = new Set(ids);
assert.equal(ids.length, uniqueIds.size, "HTML must not contain duplicate IDs");

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).filter((s) => s.trim());
assert.ok(scripts.length, "the application must include an inline script");
for (const [i, source] of scripts.entries()) {
  new Script(source, { filename: `index.html:inline-script-${i + 1}` });
}

const referencedIds = [...html.matchAll(/\$\(["']([^"']+)["']\)/g)].map((m) => m[1]);
const missingIds = [...new Set(referencedIds.filter((id) => !uniqueIds.has(id)))];
assert.deepEqual(missingIds, [], "all JavaScript ID lookups must exist in the HTML");

for (const feature of [
  "claimForm", "randomExcuseBtn", "viewCertificateBtn", "downloadCertificateBtn",
  "downloadSvgBtn", "downloadSvgInlineBtn", "exportArchiveBtn", "clearHistoryBtn",
  "appealBtn", "historyList", "resultReady", "certificate"
]) {
  assert.ok(uniqueIds.has(feature), `required feature element is missing: ${feature}`);
}

for (const behavior of [
  "scoreClaim", "renderResult", "renderHistory", "downloadCertificateSvg",
  "exportArchive", "printCertificate", "openAppeal"
]) {
  assert.ok(html.includes(`function ${behavior}(`), `required behavior is missing: ${behavior}`);
}

assert.match(html, /@media\s*\(max-width:/, "mobile responsive styles are required");
assert.match(html, /@media\s*print/, "print styles are required");
assert.match(html, /localStorage/, "local browser persistence is required");
console.log(`PCA smoke tests passed: ${ids.length} unique IDs, ${scripts.length} inline script(s), expected interactions wired.`);
