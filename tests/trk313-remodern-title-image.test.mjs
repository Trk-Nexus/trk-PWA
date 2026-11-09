/* trk313：題字の背景に実画像（url(...)）があるときは色を当てない（安全側）。装飾グラデーションは従来どおり。 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("trk313：背景の実画像（url）は判定しない（null）。判定の関数 layerOptions で見る", () => {
  const src = read("js/remodern-paint.js");
  const fn = src.slice(src.indexOf("function layerOptions"), src.indexOf("function layerOptions") + 900);
  assert.match(fn, /url\\\(/);
  assert.match(fn, /return null/);
});

test("trk313：smoke は背景画像あり・背景色のみの両方を確かめる", () => {
  const smoke = read("tools/smoke/remodern-dev-paint-smoke.mjs");
  assert.match(smoke, /trk313/);
  assert.match(smoke, /url\(data:image/);
});

test("trk313：版・HANDOFF の記録", () => {
  assert.match(read("index.html"), /name="trk-build" content=\"trk324\"/);
  assert.match(read("sw.js"), /const CACHE = "trk-v2026\.11\.04-trk324";/);
  assert.match(read("docs/HANDOFF.md"), /trk313/);
});
