// SPDX-License-Identifier: GPL-3.0-or-later
/* 🧙 trk270：Skin 側の返事を受けて、Wizard のスキンを 12 種 → 24 種に。
   ・取り込んだ 24 種が、こちらの基準（文字 4.5:1・エラー行 3:1）をすべて満たすこと
   ・届かなかった色は、**文字ではなく背景**を動かして寄せること（trk270 の取り込み v2）
   ・`auto` は「cli を名乗るスキン」を先に選ぶこと（wizard 24 種のうち 12 種だけが cli を持つ） */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { ROOT } from "./helpers/browser-data.mjs";
import { cliSource } from "./helpers/cli-src.mjs";

const wizardSrc = fs.readFileSync(path.join(ROOT, "js/skins-wizard.js"), "utf8");
const cliSrc = cliSource();

/* ---------- 画面なしで data.js ＋ 生成物を読む ---------- */
function loadWorld() {
  const sandbox = {
    console, Math, Array, Object, Number, String, JSON, Set, Map, Date, RegExp, Error,
    window: {}, TEXT: { ja: {}, en: {}, zh: {}, ko: {} }, tr: () => "",
    document: { getElementById: () => null, documentElement: { style: { setProperty() {} } } },
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js/data.js"), "utf8"), sandbox, { filename: "js/data.js" });
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js/characters/miku.js"), "utf8"), sandbox, { filename: "js/characters/miku.js" });
  vm.runInContext(wizardSrc, sandbox, { filename: "js/skins-wizard.js" });
  return sandbox.window.Trk.data;
}
const D = loadWorld();
const plain = v => JSON.parse(JSON.stringify(v));
const contrast = (fg, bg) => {
  const a = D.luminance(fg), b = D.luminance(bg);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
const WIZ = Object.keys(D.SKINS).filter(id => (D.SKINS[id].cat || []).includes("wizard")).sort();
const CLI_IDS = WIZ.filter(id => D.SKINS[id].cli);

/* ---------- js/cli.js の純粋な計算だけを読む ---------- */
function loadCliPure() {
  const from = cliSrc.indexOf("/* ==================== 純粋な計算（trk267）");
  const to = cliSrc.indexOf("/* ==================== 純粋な計算（trk267）ここまで");
  const sandbox = { console, Math, JSON, Object, Array, String, Number, Set, Map, Error, RegExp };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(cliSrc.slice(from, to) + "\nglobalThis.C = { pickCliSkin };", sandbox, { filename: "cli.js(pure)" });
  return sandbox.C;
}
const C = loadCliPure();

/* ---------- 取り込みの道具を走らせる ---------- */
function importCatalog(skins, extra = [], sharedDir = "") {
  const dir = sharedDir || fs.mkdtempSync(path.join(os.tmpdir(), "trk270-"));
  const catalog = path.join(dir, "skins.json");
  const out = path.join(dir, "wizard.js");
  fs.writeFileSync(catalog, JSON.stringify({ format: "trk-avatar-library-skins", version: 1, skins }));
  const stdout = execFileSync(process.execPath, [
    path.join(ROOT, "tools/import-skin-catalog.mjs"), catalog, "--cat=wizard", "--out=" + path.relative(ROOT, out), ...extra,
  ], { encoding: "utf8", cwd: ROOT });
  return { stdout, file: fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "" };
}
function loadGenerated(file) {
  const sandbox = {
    console, Math, Array, Object, Number, String, JSON, Set, Map,
    window: {}, document: { documentElement: { style: { setProperty() {} } }, getElementById: () => null },
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js/data.js"), "utf8"), sandbox, { filename: "js/data.js" });
  vm.runInContext(file, sandbox, { filename: "generated.js" });
  return sandbox.window.Trk.data.SKINS;
}
const COLORS = {
  bg: "#101010", panel: "#181818", text: "#e8e8e8", accent: "#39ff14", gold: "#ffb000",
  muted: "#c8c8c8", field: "#151515", button: "#202020", onAccent: "#000000",
};

/* ==================== 24 種が入っている ====================
   📚 trk274：目録の 291 種を受けたので 24 → 62 種（cli は 50 種）。ここは**数の見張り**だけを今に合わせます */
test("Wizard は 62 種（cli を名乗るのは 50 種）", () => {
  assert.equal(WIZ.length, 62);
  assert.equal(CLI_IDS.length, 50);
  for (const id of ["wizard-cli", "wizard-alchemy", "wizard-hermetic", "wizard-necromancer", "wizard-void", "wizard-tarot"]) {
    assert.ok(D.SKINS[id], id + " がありません");
  }
  /* スキン全体は 49＋ミク 4＋ウィザード 62＝115（このファイルは巻別 176 種を読まない） */
  assert.equal(Object.keys(D.SKINS).length, 115);
});

test("24 種すべてが、文字 4.5:1・エラー行 3:1 を満たす", () => {
  /* 📚 trk275（レビュー Q2「寄せ幅の上限」）：wizard-hermetic は目録の色
     （舞台 #b8860b に文字 #fffdf0＝3.19:1）のままだと 4.5:1 に届かないため、
     色を動かさず**差し戻し**（`holdback:true`・既定の棚から外す）になりました。
     ここでは棚に並ぶ 23 種を見て、hermetic は差し戻しであることを別に確かめます。 */
  assert.deepEqual(WIZ.filter(id => D.SKINS[id].holdback), ["wizard-hermetic"]);
  for (const id of WIZ.filter(id => !D.SKINS[id].holdback)) {
    const ui = D.SKINS[id].ui, game = D.SKINS[id].game;
    const need = [
      ["text/field", ui["--ui-text"], ui["--ui-field"], 4.5],
      ["text/button", ui["--ui-text"], ui["--ui-button"], 4.5],
      ["text/hover", ui["--ui-text"], ui["--ui-button-hover"], 4.5],
      ["muted/field", ui["--ui-muted"], ui["--ui-field"], 4.5],
      ["muted/button", ui["--ui-muted"], ui["--ui-button"], 4.5],
      ["muted/hover", ui["--ui-muted"], ui["--ui-button-hover"], 4.5],
      ["muted/bg", ui["--ui-muted"], ui["--ui-bg"], 4.5],
      ["onAccent/accent", ui["--ui-on-accent"], ui["--ui-accent"], 4.5],
      ["miss/field", game.miss, ui["--ui-field"], 3],
    ];
    for (const [name, fg, bg, floor] of need) {
      assert.ok(contrast(fg, bg) >= floor, `${id}: ${name} ${contrast(fg, bg).toFixed(2)}:1（${floor}:1 以上に）`);
    }
  }
});

test("cli を名乗る 12 種は、5 つの操作感（cursor / opacity / history / completion / bell）を備える", () => {
  for (const id of CLI_IDS) {
    const cli = D.SKINS[id].cli;
    for (const key of ["cursor", "opacity", "history", "completion"]) {
      assert.ok(Object.prototype.hasOwnProperty.call(cli, key), `${id}: cli.${key} がありません`);
    }
    /* bell は true のときだけ載る（名乗らない＝鳴らさない と同じ） */
    if (Object.prototype.hasOwnProperty.call(cli, "bell")) assert.equal(cli.bell, true, id + " の bell");
    assert.ok(["block", "underline", "bar"].includes(cli.cursor), id + " の cursor");
    assert.ok(cli.opacity >= 0.5 && cli.opacity <= 1, id + " の opacity");
    assert.ok(cli.history >= 10 && cli.history <= 200, id + " の history");
    assert.ok(["tab", "off"].includes(cli.completion), id + " の completion");
  }
});

/* ==================== 取り込み v2：色の寄せ方 ==================== */
test("届かない色は、文字ではなく背景（ボタン・地）を動かして寄せる", () => {
  /* 明るい文字 #ffffff … ボタン #d8d8d8 の上では読めない／地 #6f6f6f のうすい文字も届かない */
  const skins = [{
    id: "wizard-check", cat: ["wizard"],
    colors: { ...COLORS, text: "#ffffff", muted: "#8a8a8a", button: "#d8d8d8", field: "#151515", bg: "#6f6f6f" },
  }];
  const { stdout, file } = importCatalog(skins);
  assert.match(stdout, /合格点まで寄せた/);
  assert.match(stdout, /ボタン #d8d8d8 → /, "ボタンのほうを動かしている");
  const gen = loadGenerated(file)["wizard-check"];
  assert.equal(gen.ui["--ui-text"], "#ffffff", "文字の色は目録のまま");
  assert.ok(contrast(gen.ui["--ui-text"], gen.ui["--ui-button"]) >= 4.5);
  assert.ok(contrast(gen.ui["--ui-text"], gen.ui["--ui-button-hover"]) >= 4.5);
  assert.ok(contrast(gen.ui["--ui-muted"], gen.ui["--ui-bg"]) >= 4.5);
});

test("合格している目録は、そのまま（動かさない）", () => {
  const { stdout, file } = importCatalog([{ id: "wizard-check", cat: ["wizard"], colors: COLORS }]);
  assert.doesNotMatch(stdout, /合格点まで寄せた/);
  const gen = loadGenerated(file)["wizard-check"];
  assert.equal(gen.ui["--ui-text"], COLORS.text);
  assert.equal(gen.ui["--ui-button"], COLORS.button);
  assert.equal(gen.ui["--ui-muted"], COLORS.muted);
  assert.equal(gen.ui["--ui-bg"], COLORS.bg);
});

test("同じ目録なら同じバイト列（--check で見張れる）", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trk270-same-"));
  const a = importCatalog([{ id: "wizard-b", cat: ["wizard"], colors: COLORS }, { id: "wizard-a", cat: ["wizard"], colors: COLORS }], [], dir);
  const b = importCatalog([{ id: "wizard-a", cat: ["wizard"], colors: COLORS }, { id: "wizard-b", cat: ["wizard"], colors: COLORS }], [], dir);
  /* 📚 trk274：見出しに**目録ファイルの sha256**（どの写しかの印）を載せるので、
     並び順が違う目録ではその 1 行だけが変わります。スキンの表は同じでなければなりません。 */
  const table = t => t.split("\n").filter(line => !/^   目録の sha256：/.test(line)).join("\n");
  assert.equal(table(a.file), table(b.file), "並び順が違ってもスキンの表は同じバイト列");
  assert.ok(a.file.indexOf('"wizard-a"') < a.file.indexOf('"wizard-b"'), "id の辞書順");
});

test("--cli-only を外すと、cli を持たないものも入る", () => {
  const skins = [
    { id: "wizard-with", cat: ["wizard"], colors: COLORS, cli: { prompt: "λ" } },
    { id: "wizard-without", cat: ["wizard"], colors: COLORS },
  ];
  assert.match(importCatalog(skins).file, /wizard-without/);
  assert.doesNotMatch(importCatalog(skins, ["--cli-only"]).file, /wizard-without/);
});

/* ==================== auto の選び方 ==================== */
test("auto は cli を名乗るスキンを先に選ぶ（24 種でも端末の見た目が変わらない）", () => {
  /* 辞書順では wizard-alchemy（cli なし）が先。それでも cli を持つものを選ぶ */
  const list = [
    { id: "terminal", cats: ["basic"], cli: false, look: false },
    { id: "wizard-alchemy", cats: ["wizard"], cli: true, look: false },
    { id: "wizard-cli", cats: ["wizard"], cli: true, look: true },
  ];
  assert.equal(C.pickCliSkin(list, "auto"), "wizard-cli");
  /* cli を名乗るものが 1 つも無ければ、名乗り（cat）だけのものを選ぶ（trk268 と同じ） */
  assert.equal(C.pickCliSkin(list.filter(s => !s.look), "auto"), "wizard-alchemy");
  assert.equal(C.pickCliSkin(list, "terminal"), "terminal");
  assert.equal(C.pickCliSkin(list, "keep"), "");
});

test("端末の見た目に、cli を名乗るかを載せている（skinCatalog の look）", () => {
  assert.match(cliSrc, /look: !!\(def\.cli && typeof def\.cli === "object"\)/);
  assert.match(cliSrc, /isCliCat\(s\.cats\) && s\.look === true/);
});

/* ==================== 生成物そのもの ==================== */
test("生成物は目録から作ったもの（手を入れない・cli の並びも目録どおり）", () => {
  assert.match(wizardSrc, /--cat=wizard --out=js\/skins-wizard\.js/, "作り方が書いてある");
  assert.match(wizardSrc, /手で直さないでください/);
  assert.equal((wizardSrc.match(/^ {2}S\["[A-Za-z0-9_.-]+"\] = \{/gm) || []).length, 62);
  /* 書体の二重エスケープが残っていない */
  assert.doesNotMatch(wizardSrc, /\\\\"/);
  /* 明るいテーマ（hermetic）は、地を明るくして読めるようにしている */
  assert.equal(D.SKINS["wizard-hermetic"].ui["--ui-text"], "#3a2a5a");
});

/* ==================== 検査の道具（v2.1） ==================== */
function runTool(payload) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trk270-tool-"));
  const file = path.join(dir, "skin.json");
  fs.writeFileSync(file, JSON.stringify(payload));
  try {
    const stdout = execFileSync(process.execPath, [path.join(ROOT, "tools/check-cli-skin.mjs"), file, "--json"], { encoding: "utf8" });
    return { code: 0, json: JSON.parse(stdout) };
  } catch (e) {
    return { code: e.status, json: e.stdout ? JSON.parse(e.stdout) : null };
  }
}
const GOOD_SKIN = {
  id: "wizard-check", cat: ["wizard"],
  colors: { bg: "#050505", panel: "rgba(20,20,20,.97)", text: "#f0f0f0", accent: "#39ff14", gold: "#ffb000", muted: "#c8c8c8", field: "#101010", button: "#1c1c1c", onAccent: "#000000" },
  cli: { prompt: "λ", cursor: "block", opacity: 0.8, history: 80, completion: "tab", bell: true },
};

test("道具：半透明のパネル（rgba）を「色が足りない」と言わない", () => {
  const r = runTool(GOOD_SKIN);
  assert.equal(r.code, 0, JSON.stringify(r.json.problems));
  assert.ok(r.json.skins[0].good.some(g => /パネル/.test(g)), "パネルは不透明の面で測る");
});

test("道具：bell:false は正しい書き方（鳴らさない）", () => {
  const r = runTool({ ...GOOD_SKIN, cli: { ...GOOD_SKIN.cli, bell: false } });
  assert.equal(r.code, 0, JSON.stringify(r.json.problems));
  assert.deepEqual(r.json.problems, []);
});

test("本物の 62 種でも、auto は cli を名乗る先頭を選ぶ", () => {
  /* skinCatalog と同じ形（読み込み順＝生成物の id 辞書順）に直して、実際に選ばせてみる */
  const list = Object.keys(D.SKINS).map(id => {
    const def = D.SKINS[id] || {};
    const cats = Array.isArray(def.cat) ? def.cat.slice() : ["basic"];
    return { id, label: id, cats, cli: cats.some(c => ["wizard", "cli", "console"].includes(c)), look: !!(def.cli && typeof def.cli === "object") };
  });
  const picked = C.pickCliSkin(list, "auto");
  /* 📚 trk274：62 種になったので「先頭」は目録の並び（id の辞書順）で決まる */
  const firstCli = list.find(s => s.look);
  assert.equal(picked, firstCli.id, "cli を持つ最初の 1 枚");
  assert.ok(D.SKINS[picked].cli, "選ばれたスキンは cli を持つ");
  /* 62 種では辞書順の先頭（wizard-abramelin）も cli を持つので、
     「cli を持たないものを飛ばす」確かめは、cli を持たない最初の 1 枚で行う */
  const firstWithout = list.find(s => s.cats.includes("wizard") && !s.look);
  assert.ok(firstWithout, "cli を持たないウィザードがある");
  assert.equal(D.SKINS[firstWithout.id].cli, undefined, "cli を持たないことを確かめる");
});
