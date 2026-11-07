// SPDX-License-Identifier: GPL-3.0-or-later
/* trk306：スキンを変えたら、題字の色を判定し直す。
   見張ること：
   ・core.on("skin") で題字の判定をやり直す（以前は作品を選んだあとのスキン変更で色が残った）
   ・判定のやり直しは paintTitle を通る（書斎・基地には触れない）
   ・版は trk306（index.html・sw.js・trk291 の検査・HANDOFF）*/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");

test("スキンを変えたら、題字の色を判定し直す（core.on(\"skin\")）", () => {
  const ui = read("js/remodern-ui.js");
  assert.ok(ui.includes("function repaintTitle() { paintTitle(R.resolve(current(), works())); }"));
  assert.ok(ui.includes('if (typeof core.on === "function") core.on("skin", repaintTitle);'));
  const painted = ui.indexOf('core.on("skin", repaintTitle)');
  const firstRender = ui.indexOf("\n  render();\n");
  assert.ok(painted > 0 && firstRender > painted, "購読は最初の描画の前");
});

test("判定のやり直しは paintTitle を通り、書斎・基地には触れない", () => {
  const ui = read("js/remodern-ui.js");
  const fn = ui.slice(ui.indexOf("function repaintTitle()"), ui.indexOf("function repaintTitle()") + 200);
  assert.ok(fn.includes("paintTitle("));
  assert.ok(!/study|base/.test(fn));
});

test("版は trk306", () => {
  assert.match(read("index.html"), /name="trk-build" content="trk312"/);
  assert.match(read("sw.js"), /const CACHE = "trk-v2026\.11\.04-trk312";/);
});
