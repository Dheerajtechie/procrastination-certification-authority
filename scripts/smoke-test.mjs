import { readFileSync } from "node:fs";
import { Script, createContext, runInContext } from "node:vm";
import assert from "node:assert/strict";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(html, /<!doctype html>/i, "index.html must start with a doctype");
assert.match(html, /<html[^>]+lang=/i, "document language must be declared");
assert.match(html, /<meta[^>]+name=["']viewport["']/i, "responsive viewport meta is required");

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]);
const uniqueIds = new Set(ids);
assert.equal(ids.length, uniqueIds.size, "HTML must not contain duplicate IDs");
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).filter((s) => s.trim());
assert.equal(scripts.length, 1, "expected one self-contained application script");
for (const [i, source] of scripts.entries()) new Script(source, { filename: `index.html:inline-script-${i + 1}` });

const referencedIds = [...html.matchAll(/\$\(["']([^"']+)["']\)/g)].map((m) => m[1]);
const missingIds = [...new Set(referencedIds.filter((id) => !uniqueIds.has(id)))];
assert.deepEqual(missingIds, [], "all JavaScript ID lookups must exist in the HTML");

for (const feature of [
  "claimForm", "randomExcuseBtn", "viewCertificateBtn", "downloadCertificateBtn",
  "downloadSvgBtn", "downloadSvgInlineBtn", "exportArchiveBtn", "clearHistoryBtn",
  "appealBtn", "historyList", "resultReady", "certificate"
]) assert.ok(uniqueIds.has(feature), `required feature element is missing: ${feature}`);

for (const behavior of [
  "scoreClaim", "renderResult", "renderHistory", "downloadCertificateSvg",
  "exportArchive", "printCertificate", "openAppeal"
]) assert.ok(html.includes(`function ${behavior}(`), `required behavior is missing: ${behavior}`);

assert.match(html, /@media\s*\(max-width:/, "mobile responsive styles are required");
assert.match(html, /@media\s*print/, "print styles are required");
assert.match(html, /localStorage/, "local browser persistence is required");

// Exercise the real app script with a minimal DOM, rather than only checking its syntax.
const elementStore = new Map();
const storage = new Map();
const downloads = [];
let printCalls = 0;
let confirmCalls = 0;
class FakeElement {
  constructor(id = "") {
    this.id = id; this.value = ""; this.textContent = ""; this.innerHTML = "";
    this.style = {}; this.dataset = {}; this.files = []; this.children = [];
    this.listeners = {}; this.attributes = {}; this.classSet = new Set();
    this.classList = {
      add: (...names) => names.forEach((name) => this.classSet.add(name)),
      remove: (...names) => names.forEach((name) => this.classSet.delete(name)),
      contains: (name) => this.classSet.has(name),
      toggle: (name, force) => {
        const add = force === undefined ? !this.classSet.has(name) : Boolean(force);
        if (add) this.classSet.add(name); else this.classSet.delete(name);
        return add;
      }
    };
  }
  addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
  dispatch(name, event = {}) { for (const callback of this.listeners[name] || []) callback({ preventDefault() {}, target: this, ...event }); }
  appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter((child) => child !== this); }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name] || null; }
  scrollIntoView() {}
  click() { downloads.push({ id: this.id, download: this.download || "", href: this.href || "" }); this.dispatch("click"); }
  select() {}
  reset() {}
  focus() {}
}
for (const id of ids) elementStore.set(id, new FakeElement(id));
const getElement = (id) => {
  if (!elementStore.has(id)) elementStore.set(id, new FakeElement(id));
  return elementStore.get(id);
};
getElement("claimant").value = "Demo Applicant";
getElement("task").value = "Finish the challenge project";
getElement("hours").value = "8";
getElement("distractions").value = "12";
getElement("excuse").value = "tomorrow";
getElement("confession").value = "I spent all afternoon tweaking the dashboard.";
const document = {
  getElementById: getElement,
  createElement: (tag) => new FakeElement(tag),
  body: new FakeElement("body"),
  addEventListener() {}
};
const window = { addEventListener() {}, scrollTo() {}, print() { printCalls += 1; } };
const localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};
const URLMock = { createObjectURL() { return "blob:smoke-test"; }, revokeObjectURL() {} };
const context = createContext({
  document, window, localStorage, URL: URLMock, Blob,
  navigator: {}, confirm() { confirmCalls += 1; return true; },
  setTimeout() { return 1; }, clearTimeout() {}, console, Math, Date, JSON,
  String, Number, Array, Object, Boolean, RegExp, Error, parseInt, isNaN
});
runInContext(scripts[0], context, { timeout: 2000 });

getElement("claimForm").dispatch("submit");
assert.equal(getElement("resultReady").classList.contains("hidden"), false, "submitting a valid claim must show the result");
assert.equal(getElement("resultPlaceholder").classList.contains("hidden"), true, "submitting a valid claim must hide the placeholder");
assert.match(getElement("caseNumber").textContent, /^CASE NO\. PCA-/);
assert.ok(Number(getElement("scoreNumber").textContent) >= 1 && Number(getElement("scoreNumber").textContent) <= 100, "score must be in range 1–100");
assert.match(getElement("certName").textContent, /Demo Applicant/, "certificate must contain claimant name");
assert.match(getElement("certTask").textContent, /Finish the challenge project/, "certificate must contain task");
assert.equal(JSON.parse(storage.get("pca_cases_v1")).length, 1, "claim must persist to local storage");
assert.match(getElement("historyList").innerHTML, /Demo Applicant/, "case history must show submitted claim");

getElement("downloadSvgInlineBtn").dispatch("click");
assert.ok(downloads.some((item) => item.download.endsWith("-certificate.svg")), "SVG certificate must trigger a download");
getElement("exportArchiveBtn").dispatch("click");
assert.ok(downloads.some((item) => item.download.endsWith(".json")), "JSON archive must trigger a download");
getElement("downloadCertificateBtn").dispatch("click");
assert.equal(printCalls, 1, "print / Save as PDF action must call browser print");
getElement("appealBtn").dispatch("click");
assert.equal(getElement("appealModal").classList.contains("show"), true, "appeal must open its modal");

getElement("clearHistoryBtn").dispatch("click");
assert.equal(confirmCalls, 1, "archive clearing must ask for confirmation");
assert.equal(JSON.parse(storage.get("pca_cases_v1")).length, 0, "clearing archive must remove stored cases");
assert.equal(getElement("resultReady").classList.contains("hidden"), true, "clearing archive must reset the result panel");
console.log(`PCA smoke tests passed: ${ids.length} unique IDs; syntax, DOM wiring, claim submission, score, persistence, SVG download, JSON export, printing, appeals, and archive clearing all passed.`);
