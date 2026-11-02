// SPDX-License-Identifier: GPL-3.0-or-later
/* ⌨ trk268：CLI 用スキンの受け口（2 つの渡し方）を守る見張り

   ① 値で渡す（data.js に入れる）… cat・cli の整え方と、パック／カスタムスキンへの通し方
   ② パックで渡す（.stpack）…… sanitizeSkinDef → buildCustomSkin に cat・cli が残るか
   どちらも tools/check-cli-skin.mjs で同じ計算（js/data.js）を使って先に確かめられます。 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { ROOT } from "./helpers/browser-data.mjs";

const css = fs.readFileSync(path.join(ROOT, "css/style.css"), "utf8");
const cliSrc = fs.readFileSync(path.join(ROOT, "js/cli.js"), "utf8");

/* ---------- js/data.js を画面なしで読む（道具と同じ読み方） ---------- */
function loadData() {
  const sandbox = {
    console, Math, JSON, Object, Array, String, Number, Date, Set, Map, Error, RegExp, Intl,
    parseInt, parseFloat, isNaN, isFinite,
    document: { documentElement: { style: { setProperty() {} } }, getElementById: () => null, createElement: () => ({ style: {}, append() {}, addEventListener() {} }) },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js/data.js"), "utf8"), sandbox, { filename: "js/data.js" });
  return sandbox.window.Trk.data;
}
const D = loadData();
const plain = v => JSON.parse(JSON.stringify(v));

/* ---------- js/cli.js の純粋な計算だけを読む ---------- */
function loadCliPure() {
  const startMark = "/* ==================== 純粋な計算（trk267）";
  const endMark = "/* ==================== 純粋な計算（trk267）ここまで";
  const from = cliSrc.indexOf(startMark), to = cliSrc.indexOf(endMark);
  assert.ok(from > 0 && to > from, "純粋な計算の目印が見つかりません");
  const sandbox = { console, Math, JSON, Object, Array, String, Number, Set, Map, Error, RegExp, globalThis: null };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(
    cliSrc.slice(from, to) +
    "\nglobalThis.CLI = { CLI_COMMANDS, CLI_CATS, isCliCat, pickCliSkin, execute, parseLine };",
    sandbox, { filename: "js/cli.js(pure)" });
  return sandbox.CLI;
}
const CLI = loadCliPure();

/* ---------- ① カテゴリの整え方 ---------- */
test("cat は小文字の英数と - だけ・6 語までに整える", () => {
  assert.deepEqual(plain(D.sanitizeSkinCats(["Wizard", "cli", "Console"])), ["wizard", "cli", "console"]);
  assert.deepEqual(plain(D.sanitizeSkinCats(["bad cat", "..", "a/b", "", null, "<script>"])), []);
  assert.deepEqual(plain(D.sanitizeSkinCats(["a", "b", "c", "d", "e", "f", "g"])), ["a", "b", "c", "d", "e", "f"]);
  assert.deepEqual(plain(D.sanitizeSkinCats("wizard, dark")), ["wizard", "dark"]);
  assert.deepEqual(plain(D.sanitizeSkinCats(undefined)), []);
  assert.deepEqual(plain(D.sanitizeSkinCats("x".repeat(40))), []);
});

/* ---------- ① 端末の見た目（cli）の整え方 ---------- */
test("cli の値は安全な形だけ通す（かっこ・引用符・外部参照は落とす）", () => {
  assert.deepEqual(plain(D.sanitizeCliLook({ font: "Cascadia Mono, Consolas, monospace" })), { font: "Cascadia Mono, Consolas, monospace" });
  assert.equal(D.sanitizeCliLook({ font: "url(https://example.com/x.woff2)" }), null);
  assert.equal(D.sanitizeCliLook({ font: "a;b" }), null);
  assert.equal(D.sanitizeCliLook({ font: "x".repeat(121) }), null);

  assert.deepEqual(plain(D.sanitizeCliLook({ prompt: "λ" })), { prompt: "λ" });
  assert.deepEqual(plain(D.sanitizeCliLook({ prompt: ">>>" })), { prompt: ">>>" });
  assert.equal(D.sanitizeCliLook({ prompt: ">>>>>" }), null);
  assert.equal(D.sanitizeCliLook({ prompt: "url(x)" }), null);
  assert.equal(D.sanitizeCliLook({ prompt: 'a"b' }), null);

  assert.deepEqual(plain(D.sanitizeCliLook({ caret: "#39ff14" })), { caret: "#39ff14" });
  assert.deepEqual(plain(D.sanitizeCliLook({ caret: "#0f0" })), { caret: "#0f0" });
  assert.deepEqual(plain(D.sanitizeCliLook({ caret: "currentColor" })), { caret: "currentColor" });
  assert.equal(D.sanitizeCliLook({ caret: "red" }), null);

  assert.deepEqual(plain(D.sanitizeCliLook({ scan: 0.12 })), { scan: 0.12 });
  assert.deepEqual(plain(D.sanitizeCliLook({ scan: 5 })), { scan: 0.6 });
  assert.equal(D.sanitizeCliLook({ scan: 0 }), null);
  assert.equal(D.sanitizeCliLook({ scan: -1 }), null);
  assert.equal(D.sanitizeCliLook("nope"), null);
});

test("整えた cli は CSS 変数になり、プロンプトは引用符で括られる", () => {
  const vars = plain(D.cliLookVars(plain(D.sanitizeCliLook({ font: "A B", prompt: "λ", caret: "#fff", scan: 0.2 }))));
  assert.deepEqual(vars, { "--cli-font": "A B", "--cli-prompt": '"λ"', "--cli-caret": "#fff", "--cli-scan": "0.2" });
  assert.equal(D.cliLookVars(null), null);
});

/* ---------- ② パックで渡す道（sanitizeSkinDef → buildCustomSkin） ---------- */
const COLORS = { bg: "#020a04", panel: "#031406", text: "#c8ffc0", accent: "#39ff14", gold: "#ffb000" };
const DEF = { name: "Wizard CLI", colors: COLORS, cat: ["dark", "wizard"], cli: { font: "Cascadia Mono, monospace", prompt: "λ", caret: "#39ff14", scan: 0.12 } };

test("パックの skin でも cat と cli が落ちない（受け口）", () => {
  const def = plain(D.sanitizeSkinDef(DEF));
  assert.deepEqual(def.cat, ["dark", "wizard"]);
  assert.deepEqual(def.cli, { font: "Cascadia Mono, monospace", prompt: "λ", caret: "#39ff14", scan: 0.12 });
  const skin = plain(D.buildCustomSkin(def));
  assert.deepEqual(skin.cat, ["dark", "wizard"]);
  assert.equal(skin.ui["--cli-font"], "Cascadia Mono, monospace");
  assert.equal(skin.ui["--cli-prompt"], '"λ"');
  assert.equal(skin.ui["--cli-caret"], "#39ff14");
  assert.equal(skin.ui["--cli-scan"], "0.12");
});

test("cat・cli が無いパックは、これまでどおり（余計な鍵を増やさない）", () => {
  const def = plain(D.sanitizeSkinDef({ name: "Plain", colors: COLORS }));
  assert.deepEqual(def.cat, []);
  assert.equal(def.cli, null);
  const skin = plain(D.buildCustomSkin(def));
  assert.equal("cat" in skin, false);
  assert.equal(Object.keys(skin.ui).some(k => k.startsWith("--cli-")), false);
});

/* ---------- ① 見分け方（別名） ---------- */
test("wizard／cli／console のどれでも CLI 用として選ぶ", () => {
  const skins = [
    { id: "shadow", cats: ["basic"] },
    { id: "my-cli", cats: ["dark", "cli"] },
    { id: "terminal", cats: ["basic"] },
  ];
  assert.equal(CLI.pickCliSkin(skins, "auto"), "my-cli");
  assert.equal(CLI.pickCliSkin([{ id: "c", cats: ["console"] }], "auto"), "c");
  assert.equal(CLI.pickCliSkin([{ id: "w", cats: ["wizard"] }], "auto"), "w");
  assert.equal(CLI.pickCliSkin(skins, "terminal"), "terminal");
  assert.equal(CLI.pickCliSkin(skins, "keep"), "");
  assert.equal(CLI.pickCliSkin([{ id: "a", cats: ["basic"] }], "auto"), "");
  assert.equal(CLI.isCliCat(["WIZARD"]), true);
  assert.equal(CLI.isCliCat("wizard"), false);
  assert.deepEqual(plain(CLI.CLI_CATS), ["wizard", "cli", "console"]);
});

test("grimoire の絞り込みも別名で同じものが出る", async () => {
  const skins = [
    { id: "shadow", label: "Shadow", cats: ["basic"], cli: false },
    { id: "wiz", label: "Wizard", cats: ["wizard"], cli: true },
    { id: "term", label: "Terminal", cats: ["basic"], cli: false },
  ];
  const deps = { t: (k, v) => k + (v ? " " + Object.values(v).join(" ") : ""), skins: () => skins };
  for (const word of ["wizard", "cli", "console"]) {
    const res = await CLI.execute("grimoire " + word, deps);
    const text = res.out.map(o => o.text).join("\n");
    assert.ok(text.includes("cliGrimoireFilter"), word + " の見出しが出る");
    assert.ok(text.includes("Wizard"), word + " で CLI 用のスキンが出る");
    assert.ok(!text.includes("Shadow"), word + " で基本スキンは出ない");
  }
});

/* ---------- CSS の受け口 ---------- */
test("端末の見た目は CSS 変数から取る（既定は今までどおり）", () => {
  assert.ok(css.includes("var(--cli-font,ui-monospace"), "書体");
  assert.ok(css.includes('content:var(--cli-prompt,">")'), "入力の合図");
  assert.ok(css.includes("caret-color:var(--cli-caret,currentColor)"), "カーソルの色");
  assert.ok(css.includes("opacity:var(--cli-scan,0)"), "走査線");
  assert.ok(!/\.cliInput\{[^}]*color:var\(--ui-accent\)/.test(css), "小さい文字は accent-ink 側を使う");
});

/* ---------- 受け入れの道具 ---------- */
function runTool(obj) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-skin-"));
  const file = path.join(dir, "skin.json");
  fs.writeFileSync(file, JSON.stringify(obj));
  try {
    const out = execFileSync(process.execPath, [path.join(ROOT, "tools/check-cli-skin.mjs"), file, "--json"], { encoding: "utf8" });
    return { code: 0, json: JSON.parse(out) };
  } catch (e) {
    return { code: e.status, json: e.stdout ? JSON.parse(e.stdout) : null };
  }
}

test("check-cli-skin：受け取れる値なら 0", () => {
  const r = runTool({
    id: "wizard-cli", cat: ["dark", "wizard"],
    colors: { ...COLORS, text: "#e8ffe4", panel: "#020a04" },
    cli: { font: "Cascadia Mono, monospace", prompt: "λ", caret: "#39ff14", scan: 0.12 },
  });
  assert.equal(r.code, 0, JSON.stringify(r.json && r.json.problems));
  assert.equal(r.json.ok, true);
  assert.equal(r.json.tool, "check-cli-skin");
});

test("check-cli-skin：名乗りが無く、コントラストも足りなければ 1", () => {
  const r = runTool({
    skin: { id: "wizard-cli", cat: ["dark"], colors: { bg: "#101010", panel: "#181818", text: "#6a6a6a", accent: "#555555", gold: "#888888" } },
  });
  assert.equal(r.code, 1);
  assert.equal(r.json.ok, false);
  assert.ok(r.json.problems.some(p => p.includes("cat")));
  assert.ok(r.json.problems.some(p => p.includes("4.5:1")));
});

test("check-cli-skin：形が違えば 2（読めない）", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-skin-"));
  const file = path.join(dir, "bad.json");
  fs.writeFileSync(file, "not json");
  assert.throws(() => execFileSync(process.execPath, [path.join(ROOT, "tools/check-cli-skin.mjs"), file], { stdio: "pipe" }),
    e => e.status === 2);
});
