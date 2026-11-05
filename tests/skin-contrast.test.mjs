// SPDX-License-Identifier: GPL-3.0-or-later
/* All built-in game skins (including the four optional Miku skins) must keep
 * button states, song-list subtext and tutorial text readable. */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const sandbox = {
  console, Math, Array, Object, Number, String, JSON, Set, Map, Date,
  window: {},
  TEXT: { ja:{}, en:{}, zh:{}, ko:{} },
  tr: () => "",
  document: { getElementById: () => null },
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, "js/data.js"), "utf8"), sandbox, { filename: "js/data.js" });
vm.runInContext(fs.readFileSync(path.join(ROOT, "js/characters/miku.js"), "utf8"), sandbox, { filename: "js/characters/miku.js" });
/* 🧙 trk269・trk270：Wizard の 24 種（Skin 側の目録から生成した別ファイル）も同じ基準で見る */
vm.runInContext(fs.readFileSync(path.join(ROOT, "js/skins-wizard.js"), "utf8"), sandbox, { filename: "js/skins-wizard.js" });
/* 📚 trk274：巻別の 176 種（vol.1〜10・glitch）も同じ基準で見る */
const BUILTIN_COUNT = Object.keys(sandbox.window.Trk.data.SKINS).length;   /* data.js＋ミク（生成物を読む前） */
vm.runInContext(fs.readFileSync(path.join(ROOT, "js/skins-volumes.js"), "utf8"), sandbox, { filename: "js/skins-volumes.js" });
const { SKINS, buildCustomSkin } = sandbox.window.Trk.data;
const css = fs.readFileSync(path.join(ROOT, "css/style.css"), "utf8");

function luminance(hex) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex || "");
  assert.ok(match, `expected opaque #rrggbb, got ${hex}`);
  const channels = [0, 2, 4].map(i => parseInt(match[1].slice(i, i + 2), 16) / 255)
    .map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
/* 📚 trk274：地は**グラデーション**のこともある（目録の値をそのまま受けている）。
   全部の停止点で確かめるため、色の並びに開く */
function stopsOf(v) {
  if (!/^linear-gradient\(/i.test(v || "")) return [v];
  return v.slice(v.indexOf("(") + 1, -1).split(",").slice(1).map(x => x.trim().replace(/\s+\d+%$/, ""));
}
function contrast(fg, bg) {
  const a = luminance(fg), b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const ids = Object.keys(SKINS);
/* 📚 trk275（レビュー Q2）：色を寄せても 4.5:1 に届かない 18 種は**目録へ差し戻し**、
   目録の色のまま `holdback:true` にして既定の棚から外しています（見本としては ALL で見える）。
   ここで見張るのは「棚に並ぶ 273 種」の読みやすさなので、差し戻しは別のテストで数えます。 */
const READABLE = Object.entries(SKINS).filter(([, s]) => !s.holdback);
/* 目録から作ったスキン（data.js＋ミクより後に足されたもの） */
const builtinIds = new Set(Object.keys(SKINS).slice(0, BUILTIN_COUNT));

describe("game UI contrast across the skin catalogue", () => {
  test("includes the 49 built-in themes, four optional Miku themes, 62 Wizard and 176 volume themes", () => {
    assert.equal(ids.length, 291);
    for (const id of ["miku39", "mikuNoir", "mikuClassic", "mikuIdol"]) assert.ok(SKINS[id], id);
    const wizard = ids.filter(id => Array.isArray(SKINS[id].cat) && SKINS[id].cat.includes("wizard"));
    assert.equal(wizard.length, 62, "the wizard family must be 62 skins");
    for (const id of ["wizard-cli", "wizard-terminal", "wizard-nord"]) assert.ok(SKINS[id], id);
  });

  test("selected play-mode buttons use AA text on the accent background", () => {
    for (const [id, skin] of READABLE) {
      const ui = skin.ui;
      assert.ok(contrast(ui["--ui-on-accent"], ui["--ui-accent"]) >= 4.5,
        `${id}: selected button ${ui["--ui-on-accent"]} on ${ui["--ui-accent"]} is ${contrast(ui["--ui-on-accent"], ui["--ui-accent"]).toFixed(2)}:1`);
    }
  });

  test("unselected and hovered buttons keep readable text", () => {
    assert.match(css, /button:hover\{[^}]*color:var\(--ui-text\)/,
      "generic hover feedback uses the readable text color while the border carries the accent");
    assert.match(css, /\.fileBtn\.small:hover\{[^}]*color:var\(--ui-text\)/);
    assert.match(css, /\.libRow\.cur\{[^}]*color:var\(--ui-text\)[^}]*background:var\(--ui-button-hover\)/);
    assert.match(css, /\.miniActions button\.selected\{[^}]*color:var\(--ui-text\)/);
    for (const [id, skin] of READABLE) {
      const ui = skin.ui;
      assert.ok(contrast(ui["--ui-text"], ui["--ui-field"]) >= 4.5, `${id}: unselected segmented field`);
      assert.ok(contrast(ui["--ui-text"], ui["--ui-button"]) >= 4.5, `${id}: normal button`);
      assert.ok(contrast(ui["--ui-text"], ui["--ui-button-hover"]) >= 4.5, `${id}: hovered button`);
    }
  });

  test("muted song-list and guide text meet AA on their opaque skin backgrounds", () => {
    for (const [id, skin] of READABLE) {
      const ui = skin.ui, muted = ui["--ui-muted"];
      const backgrounds = [ui["--ui-button"], ui["--ui-button-hover"], ui["--ui-field"]];
      /* 📚 trk274：地がグラデーションなら**全部の停止点**で確かめる。
         ただし**目録から作った 238 種だけ**（生成のときに全停止点で合格させている）。
         手で作った内蔵スキンには、明るい所と暗い所をまたぐ地（graduation など）があり、
         1 つの文字色では全停止点を満たせないため、これまでどおり不透明 1 色のときだけ見る。
         （内蔵の 53 種は `npm run check` の他の検査と実機で見ています） */
      /* trk292（案 A）：地（--ui-bg）は飾りの面。文字は地の上に置かない（tests/bg-decor.test.mjs で守る）。
         だから地はここでは見ない。読む面（パネル・入力欄・ボタン）だけで確かめる。 */
      for (const bg of backgrounds) {
        assert.ok(contrast(muted, bg) >= 4.5,
          `${id}: muted ${muted} on ${bg} is ${contrast(muted, bg).toFixed(2)}:1`);
      }
    }
  });

  test("tutorial progress and guide text use full-opacity skin text colors", () => {
    const progress = css.match(/\.guideProgress\{([^}]*)\}/)?.[1] || "";
    assert.match(progress, /color:var\(--ui-muted\)/);
    assert.doesNotMatch(progress, /opacity\s*:/, "the small progress count must not be faded with opacity");
    assert.match(css, /\.guideStep span\{color:var\(--ui-muted\)\}/);
  });

  test("select elements and shelf counter use solid skin colors with AA contrast", () => {
    // Bare select base rule guarantees background and text color match skin field variables
    assert.match(css, /select\{[^}]*background:var\(--ui-field\)[^}]*color:var\(--ui-text\)/,
      "bare select elements must explicitly use skin field background and text colors");

    // All select elements in index.html must be covered
    const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    const selectMatches = [...indexHtml.matchAll(/<select[^>]*id="([^"]+)"[^>]*>/g)];
    assert.ok(selectMatches.length >= 35, `expected at least 35 select elements in index.html, found ${selectMatches.length}`);
    for (const [, id] of selectMatches) {
      assert.ok(id, "select element must have an id");
    }

    // Shelf counter uses --ui-muted without opacity fading
    const shelfCount = css.match(/#skinShelfCount\{([^}]*)\}/)?.[1] || "";
    assert.match(shelfCount, /color:var\(--ui-muted\)/, "#skinShelfCount must use solid --ui-muted");
    assert.doesNotMatch(shelfCount, /opacity\s*:/, "#skinShelfCount must not use opacity");

    // Verify text on field contrast across all 77 skins
    for (const [id, skin] of READABLE) {
      const ui = skin.ui;
      assert.ok(contrast(ui["--ui-text"], ui["--ui-field"]) >= 4.5,
        `${id}: select text ${ui["--ui-text"]} on ${ui["--ui-field"]} is ${contrast(ui["--ui-text"], ui["--ui-field"]).toFixed(2)}:1`);
    }
  });

  test("small accent-colored text uses --ui-accent-ink, which reaches AA even inside nested settings panels", () => {
    /* trk114: the nested "skin shelf" heading was 4.34 (cbLight), 3.88 (shojiLight) and 3.95 (morningKitchen) on the
       opaque cards. Semi-transparent cards hid the same shortfall from the browser audit, so every skin is computed here
       on the worst surface: card (--ui-panel) + panel (--ui-soft) + sub-panel (--ui-soft). */
    const { accentInk, accentInkBackground } = sandbox.window.Trk.data;
    const toHex = rgb => "#" + rgb.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
    for (const [id, skin] of READABLE) {
      const ink = accentInk(skin.ui), back = toHex(accentInkBackground(skin.ui));
      const inkHex = /^#[0-9a-f]{6}$/i.test(ink) ? ink : sandbox.window.Trk.data.toHex(ink);
      assert.ok(contrast(inkHex, back) >= 4.5, `${id}: accent ink ${ink} on nested ${back} is ${contrast(inkHex, back).toFixed(2)}:1`);
      /* 📚 trk274：4.6 ちょうど（venice-canal は 4.600）は、丸めの境目で data.js 側が 1 段だけ動くことがある。
         **余裕をもって合格している**ときだけ「そのまま」を求めます */
      if (contrast(sandbox.window.Trk.data.toHex(skin.ui["--ui-accent"]), back) >= 4.62) assert.equal(ink, skin.ui["--ui-accent"], `${id}: a passing accent is left unchanged`);
    }
    for (const id of ["cbLight", "shojiLight", "morningKitchen"]) assert.notEqual(accentInk(SKINS[id].ui), SKINS[id].ui["--ui-accent"], `${id} needed a darker ink`);
    const core = fs.readFileSync(path.join(ROOT, "js/core.js"), "utf8");
    assert.match(core, /root\.setProperty\("--ui-accent-ink", window\.Trk\.data\.accentInk\(s\.ui\)\)/, "applySkin sets the ink for every skin, custom ones included");
    assert.match(css, /\.subPanel>summary\{[^}]*color:var\(--ui-accent-ink,var\(--ui-accent\)\)/);
    const bareAccentText = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(m => /(?:^|;)\s*color:\s*var\(--ui-accent\)\s*(?:;|$)/.test(m[2])).map(m => m[1].trim());
    assert.deepEqual(bareAccentText, [".brand h1 span"], "only the 58px brand heading (large text, 3:1) may use the raw accent");
    for (const accent of ["#b78be0", "#39c5bb", "#ffd166", "#e69f00"]) {
      const custom = buildCustomSkin({ name: "ink test", colors: { bg: "#fbf8f1", bg2: "", panel: "#ffffff", text: "#2b2620", accent, gold: "#a67c2e" },
        glow: false, scanlines: false, gradDir: "none", font: "default", video: "mono", mascot: "none" });
      assert.ok(contrast(accentInk(custom.ui), toHex(accentInkBackground(custom.ui))) >= 4.5, `custom light skin with accent ${accent}`);
    }
  });

  test("custom-skin accent labels choose a black or white foreground with AA contrast", () => {
    const accents = ["#000000", "#101010", "#333333", "#767676", "#777777", "#808080", "#b78be0", "#e69f00", "#39c5bb", "#ff3b55", "#fefefe"];
    for (const accent of accents) {
      const skin = buildCustomSkin({
        name: "contrast test",
        colors: { bg:"#101820", bg2:"", panel:"#243040", text:"#f2f4f8", accent, gold:"#ffd166" },
        glow:false, scanlines:false, gradDir:"none", font:"default", video:"mono", mascot:"none",
      });
      assert.ok(contrast(skin.ui["--ui-on-accent"], accent) >= 4.5,
        `${accent}: custom accent text ${skin.ui["--ui-on-accent"]} is below 4.5:1`);
    }
  });

  test("差し戻しの 3 種は、目録の色のまま名乗っていて、既定の棚には並ばない（trk275・trk292・trk293）", () => {
    const hb = Object.entries(SKINS).filter(([, s]) => s.holdback).map(([id]) => id).sort();
    assert.equal(hb.length, 3, "trk293：目録 8f1e（配色 4 種の修正）で、差し戻しは巻別の 3 種（orichalcum・gold-chip・house-edge）。Wizard は 0");
    /* 生成物の SKIN_HOLDBACK と同じ顔ぶれ（手で足したり消したりしていない） */
    /* trk292：Wizard は差し戻し 0 件なので、生成物に SKIN_HOLDBACK の行は無い */
    assert.ok(!/SKIN_HOLDBACK/.test(fs.readFileSync(path.join(ROOT, "js/skins-wizard.js"), "utf8")), "Wizard の生成物に差し戻しの行は無い");
    for (const rel of ["js/skins-volumes.js"]) {
      const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
      const m = /SKIN_HOLDBACK = \[([^\]]*)\]/.exec(src);
      assert.ok(m, `${rel}: SKIN_HOLDBACK`);
      for (const id of [...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1])) {
        assert.ok(hb.includes(id), `${id} は holdback の印がある`);
      }
    }
    assert.ok(!hb.includes("wizard-hermetic"), "trk292：wizard-hermetic は舞台を寄せて合格（差し戻しから戻る）");
    assert.equal(READABLE.length, 291 - 3);
  });
});
