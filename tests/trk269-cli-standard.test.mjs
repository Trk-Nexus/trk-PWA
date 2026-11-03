// SPDX-License-Identifier: GPL-3.0-or-later
/* ⌨ trk269：端末の定番（pwd・ls・cd・cat・grep・history・clear・echo・man・bell と `|`）と、
   Wizard のスキン（Skin 側の目録から生成。trk270 で 24 種に）を守る見張り。 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { ROOT } from "./helpers/browser-data.mjs";
import { cliSource } from "./helpers/cli-src.mjs";

const cliSrc = cliSource();
const css = fs.readFileSync(path.join(ROOT, "css/style.css"), "utf8");
const wizardSrc = fs.readFileSync(path.join(ROOT, "js/skins-wizard.js"), "utf8");
const plain = v => JSON.parse(JSON.stringify(v));

/* ---------- js/cli.js の純粋な計算だけを読む ---------- */
function loadCliPure() {
  const from = cliSrc.indexOf("/* ==================== 純粋な計算（trk267）");
  const to = cliSrc.indexOf("/* ==================== 純粋な計算（trk267）ここまで");
  assert.ok(from > 0 && to > from);
  const sandbox = { console, Math, JSON, Object, Array, String, Number, Set, Map, Error, RegExp };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(cliSrc.slice(from, to) +
    "\nglobalThis.C = { CLI_COMMANDS, CLI_HELP, CLI_ALIASES, splitSpells, parseLine, execute };", sandbox, { filename: "cli.js(pure)" });
  return sandbox.C;
}
const C = loadCliPure();

/* ---------- js/data.js（画面なし） ---------- */
function loadData() {
  const sandbox = {
    console, Math, JSON, Object, Array, String, Number, Date, Set, Map, Error, RegExp, Intl,
    parseInt, parseFloat, isNaN, isFinite,
    document: { documentElement: { style: { setProperty() {} } }, getElementById: () => null, createElement: () => ({ style: {}, append() {}, addEventListener() {} }) },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js/data.js"), "utf8"), sandbox, { filename: "js/data.js" });
  vm.runInContext(wizardSrc, sandbox, { filename: "js/skins-wizard.js" });
  return sandbox.window.Trk.data;
}
const D = loadData();

/* ---------- 偽の曲リストと窓口 ---------- */
const TRACKS = [
  { title: "夜に駆ける", src: "YOASOBI" },
  { title: "Lemon", src: "米津玄師" },
  { title: "Night Drive", src: "trk" },
];
const deps = () => ({
  t: (k, v) => k + (v ? " " + Object.values(v).join(" ") : ""),
  name: it => it.title,
  src: it => it.src,
  tracks: () => TRACKS,
  current: () => ({ skin: "terminal", volume: 80, track: "Lemon" }),
  history: () => ["> help", "> list"],
  setBell: on => { deps.bell = on; return true; },
  listLimit: 40,
});
const text = res => res.out.map(o => o.text).join("\n");
const run = (line, extra = {}) => C.execute(line, { ...deps(), ...extra });

/* ==================== 定番のコマンド ==================== */
test("CLI_COMMANDS に定番が並び、help がその全部を説明する", () => {
  for (const c of ["pwd", "ls", "cd", "cat", "grep", "history", "clear", "echo", "man", "bell"]) {
    assert.ok(C.CLI_COMMANDS.includes(c), c);
  }
  const helped = C.CLI_HELP.map(([word]) => word);
  const names = { ls: "ls", cd: "cd", man: "help", dir: "ls" };
  for (const c of ["pwd", "ls", "cd", "cat", "grep", "history", "clear", "echo", "bell"]) {
    assert.ok(helped.includes(names[c] || c), `help に ${c} がありません`);
  }
});

test("pwd はいまの様子を 1 行で返す", async () => {
  const res = await run("pwd");
  assert.equal(res.out.length, 1);
  assert.equal(res.out[0].kind, "out");
  assert.match(res.out[0].text, /cliPwd/);
});

test("ls は list の別名、言葉を添えると grep になる", async () => {
  const list = text(await run("ls"));
  assert.match(list, /cliListTitle/);
  const filtered = text(await run("ls 夜"));
  assert.match(filtered, /cliGrepTitle/);
  assert.match(filtered, /夜に駆ける/);
  assert.doesNotMatch(filtered, /Lemon/);
});

test("cd は skin の別名（唱えたら残る扱い）", async () => {
  const calls = [];
  const res = await run("cd wizard-cli", { skins: () => [{ id: "wizard-cli", label: "Wizard", cats: ["wizard"] }], applySkin: id => { calls.push(id); return { ok: true }; } });
  assert.deepEqual(calls, ["wizard-cli"]);
  assert.equal(res.out.at(-1).kind, "out");
});

test("man は help の別名（引数があると 1 つだけ説明する）", async () => {
  /* ⌨ trk286：引数なしは短い一覧、全部は `help all` */
  const all = text(await run("help all"));
  assert.match(all, /cliHelpPwd/);
  assert.match(all, /cliHelpGrep/);
  const brief = text(await run("man"));
  assert.doesNotMatch(brief, /cliHelpPwd/, "ふだんは短い");
  const one = text(await run("man grep"));
  assert.match(one, /cliHelpGrep/);
  assert.doesNotMatch(one, /cliHelpPwd/);
});

test("grep は曲名と出どころの両方から探し、番号を添える", async () => {
  const a = text(await run("grep 夜"));
  assert.match(a, /「?夜」?/);
  assert.match(a, /1\. 夜に駆ける — YOASOBI|1.*夜に駆ける/);
  const b = text(await run("grep trk"));
  assert.match(b, /Night Drive/);
  assert.doesNotMatch(b, /Lemon/);
});

test("cat は曲の中身、cat spell は呪文の本文", async () => {
  const song = text(await run("cat Lemon"));
  assert.match(song, /cliCatTitle/);
  assert.match(song, /cliCatPlayHint|play/);
  const spell = text(await run("cat spell midnight", { spells: () => ({ midnight: "skin terminal; volume 30" }) }));
  assert.match(spell, /skin terminal; volume 30/);
  const none = text(await run("cat spell nope", { spells: () => ({ midnight: "x" }) }));
  assert.match(none, /cliSpellUnknown/);
});

test("cat は生のパスを受け付けない（play と同じ関所）", async () => {
  const res = await run("cat ../etc/passwd");
  assert.equal(res.out[0].kind, "err");
  assert.match(res.out[0].text, /cliPathRefused/);
});

test("history は打った呪文を返し、空のときはそう言う", async () => {
  const res = await run("history");
  assert.match(text(res), /cliHistoryTitle/);
  assert.match(text(res), /> help/);
  const empty = await run("history", { history: () => [] });
  assert.match(text(empty), /cliHistoryEmpty/);
});

test("clear は「消した」を返し、UI に合図（clear:true）を渡す", async () => {
  const res = await run("clear");
  assert.equal(res.clear, true);
  assert.match(text(res), /cliCleared/);
  assert.equal((await run("echo hi")).clear, false);
});

test("echo はそのまま返す", async () => {
  const res = await run("echo 呪文 テスト");
  assert.equal(res.out[0].text, "呪文 テスト");
});

test("bell on / off は設定を切り替える（語が違えば断る）", async () => {
  const seen = [];
  const setBell = on => { seen.push(on); return true; };
  assert.match(text(await run("bell on", { setBell })), /cliBellOn/);
  assert.match(text(await run("bell off", { setBell })), /cliBellOff/);
  assert.deepEqual(seen, [true, false]);
  assert.equal((await run("bell たぶん", { setBell })).out[0].kind, "err");
});

test("パイプ `|` は「続けて唱える」と同じ", async () => {
  const calls = [];
  const res = await C.execute("volume 30 | volume 40", {
    t: k => k,
    setVolume: null,
    volume: pct => { calls.push(pct); return { ok: true }; },
  });
  assert.deepEqual(calls, [30, 40]);
  assert.equal(res.out.filter(o => o.text === "cliVolumeSet").length, 2);
  assert.deepEqual(plain(C.splitSpells("play 2|volume 30")), ["play 2", "volume 30"]);
  assert.deepEqual(plain(C.splitSpells("a; b\nc")), ["a", "b", "c"]);
});

/* ==================== スキンが決める操作感（§4-1 の 5 つ） ==================== */
test("cli の 5 つ（cursor / opacity / history / completion / bell）を整える", () => {
  assert.deepEqual(plain(D.sanitizeCliLook({ cursor: "block" })), { cursor: "block" });
  assert.deepEqual(plain(D.sanitizeCliLook({ cursor: "underline" })), { cursor: "underline" });
  assert.equal(D.sanitizeCliLook({ cursor: "sparkle" }), null, "決まった語以外は通さない");

  assert.deepEqual(plain(D.sanitizeCliLook({ opacity: 0.8 })), { opacity: 0.8 });
  assert.deepEqual(plain(D.sanitizeCliLook({ opacity: 0.1 })), { opacity: 0.5 }, "下限 0.5");
  assert.deepEqual(plain(D.sanitizeCliLook({ opacity: 9 })), { opacity: 1 }, "上限 1");

  assert.deepEqual(plain(D.sanitizeCliLook({ history: 80 })), { history: 80 });
  assert.deepEqual(plain(D.sanitizeCliLook({ history: 1 })), { history: 10 }, "下限 10");
  assert.deepEqual(plain(D.sanitizeCliLook({ history: 9999 })), { history: 200 }, "上限 200");

  assert.deepEqual(plain(D.sanitizeCliLook({ completion: "off" })), { completion: "off" });
  assert.equal(D.sanitizeCliLook({ completion: "maybe" }), null);

  assert.deepEqual(plain(D.sanitizeCliLook({ bell: true })), { bell: true });
  assert.equal(D.sanitizeCliLook({ bell: "yes" }), "[object Object]" === "" ? null : null, "真偽値だけ");
  assert.equal(D.sanitizeCliLook({ bell: false }), null, "false は名乗らないのと同じ");
});

test("cursor と opacity は CSS 変数になり、危ない値は素通りしない", () => {
  const vars = plain(D.cliLookVars(plain(D.sanitizeCliLook({ cursor: "block", opacity: 0.7 }))));
  assert.deepEqual(vars, { "--cli-cursor-shape": "block", "--cli-opacity": "0.7" });
  assert.equal(D.cliLookVars(plain(D.sanitizeCliLook({ cursor: "underline" })))["--cli-cursor-shape"], "underscore");
  /* 既存の 4 つも、これまでどおり通る */
  const old = plain(D.cliLookVars(plain(D.sanitizeCliLook({ font: "Courier New", prompt: "λ", caret: "#39ff14", scan: 0.12 }))));
  assert.equal(old["--cli-font"], "Courier New");
  assert.equal(old["--cli-prompt"], '"λ"');
  assert.equal(old["--cli-caret"], "#39ff14");
  assert.equal(old["--cli-scan"], "0.12");
});

test("CSS は opacity とカーソルの形を受け取る（文字は薄くしない）", () => {
  assert.match(css, /\.cliDialog::before\{[^}]*opacity:var\(--cli-opacity,1\)/, "地は ::before に置いて透けさせる");
  assert.match(css, /caret-shape:var\(--cli-cursor-shape,auto\)/);
});

/* ==================== Wizard のスキン 12 種 ==================== */
/* 📚 trk274：目録の 291 種を受けたので、Wizard は 24 → 62 種（cli は 12 → 50 種）になった */
test("Wizard のスキンは 62 種。どれも cat に wizard を持つ（cli は 50 種）", () => {
  const ids = Object.keys(D.SKINS).filter(id => (D.SKINS[id].cat || []).includes("wizard"));
  assert.equal(ids.length, 62);
  assert.equal(ids.filter(id => D.SKINS[id].cli).length, 50, "cli を名乗るのは 50 種");
  for (const id of ids) {
    const s = D.SKINS[id];
    assert.ok(s.ui["--ui-text"] && s.ui["--ui-field"], id + " の色が足りません");
    assert.ok(s.label && s.label.ja, id + " に名前がありません");
  }
  assert.ok(Object.keys(D.SKINS).length >= 111, "data.js（49）＋ Wizard（62）");
});

test("目録から作ったファイルは、手で直さない・出どころが分かる", () => {
  assert.match(wizardSrc, /tools\/import-skin-catalog\.mjs/, "作り方が書いてある");
  assert.match(wizardSrc, /手で直さないでください/);
  /* 📚 trk274：camelCase の id（wizard-auraCaster などではなく目録の id）も通るので、字種を広げる */
  assert.equal((wizardSrc.match(/^ {2}S\["[A-Za-z0-9_.-]+"\] = \{/gm) || []).length, 62);
  /* 書体の二重エスケープ（\"Courier New\"）が残っていない */
  assert.doesNotMatch(wizardSrc, /\\\\"/, "font の \\\" が残っています");
});

test("取り込みは決定的（同じ目録なら同じバイト列・--check で見張れる）", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trk269-"));
  const catalog = path.join(dir, "skins.json");
  const out = path.join(dir, "wizard.js");
  const colors = { bg: "#050505", panel: "#031406", text: "#e8ffe4", accent: "#39ff14", gold: "#ffb000", muted: "#9fe0a8", field: "#0a0a0a" };
  const skins = [
    { id: "wizard-b", cat: ["wizard"], label: { ja: "B" }, desc: { ja: "b" }, colors, cli: { font: "Courier New", prompt: "λ", scan: 0.1 } },
    { id: "wizard-a", cat: ["wizard", "dark"], label: { ja: "A" }, desc: { ja: "a" }, colors },
    { id: "plain-one", cat: ["basic"], label: { ja: "C" }, desc: { ja: "c" }, colors, cli: { prompt: ">" } },
  ];
  fs.writeFileSync(catalog, JSON.stringify({ format: "trk-avatar-library-skins", version: 1, skins }));
  const run = extra => execFileSync(process.execPath, [path.join(ROOT, "tools/import-skin-catalog.mjs"), catalog, "--cat=wizard", "--cli-only", "--out=" + path.relative(ROOT, out), ...extra], { encoding: "utf8", cwd: ROOT });
  run([]);
  const first = fs.readFileSync(out, "utf8");
  run([]);
  assert.equal(fs.readFileSync(out, "utf8"), first, "2 回目も同じバイト列");
  assert.match(first, /S\["wizard-b"\]/);
  assert.doesNotMatch(first, /plain-one/, "CLI を名乗らないものは入らない");
  assert.doesNotMatch(first, /wizard-a/, "--cli-only は cli を持つものだけ");
  assert.match(run(["--check"]), /目録どおり/);
});

/* ==================== 受け入れの道具（v2） ==================== */
function runTool(payload) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trk269-tool-"));
  const file = path.join(dir, "skin.json");
  fs.writeFileSync(file, typeof payload === "string" ? payload : JSON.stringify(payload));
  try {
    const out = execFileSync(process.execPath, [path.join(ROOT, "tools/check-cli-skin.mjs"), file, "--json"], { encoding: "utf8" });
    return { code: 0, json: JSON.parse(out) };
  } catch (e) {
    return { code: e.status, json: e.stdout ? JSON.parse(e.stdout) : null };
  }
}
const GOOD = {
  id: "wizard-cli", cat: ["wizard"],
  colors: { bg: "#050505", panel: "#031406", text: "#e8ffe4", accent: "#39ff14", gold: "#ffb000", muted: "#9fe0a8", field: "#0a0a0a", button: "#1a1a1a", onAccent: "#000000" },
  cli: { font: "Cascadia Mono, monospace", prompt: "λ", caret: "#39ff14", scan: 0.12, cursor: "block", opacity: 0.8, history: 80, completion: "tab", bell: true },
};

test("道具：5 つの操作感も見て、通れば 0", () => {
  const r = runTool(GOOD);
  assert.equal(r.code, 0, JSON.stringify(r.json && r.json.problems));
  const ok = r.json.skins[0].good.join(" ");
  assert.match(ok, /cursor|opacity|history|completion|bell/);
});

test("道具：道の文字（/ \\ ` ~ : .. C:）は断る", () => {
  const r = runTool({ ...GOOD, cli: { ...GOOD.cli, prompt: "~/", font: "C:/Windows/Fonts/mono" } });
  assert.equal(r.code, 1);
  assert.ok(r.json.problems.some(p => /道|path/.test(p)), JSON.stringify(r.json.problems));
});

test("道具：目録を渡したときは、CLI を名乗るスキンだけを判定する", () => {
  const r = runTool({ format: "trk-avatar-library-skins", version: 1, skins: [
    { id: "shadow", cat: ["basic"], colors: GOOD.colors },
    { id: "wizard-cli", cat: ["wizard"], colors: GOOD.colors, cli: GOOD.cli },
  ] });
  assert.equal(r.code, 0, JSON.stringify(r.json.problems));
  assert.equal(r.json.skins.filter(s => s.ok).length, 1);
  assert.ok(r.json.notes.some(n => /shadow/.test(n)), "名乗らないものはメモに回す");
});

test("道具：--json には理由（reason）が付く", () => {
  const ok = runTool(GOOD);
  assert.equal(ok.json.reason, "ok");
  const name = runTool({ ...GOOD, cat: ["dark"] });
  assert.equal(name.json.reason, "name");
  const contrast = runTool({ ...GOOD, colors: { ...GOOD.colors, text: "#6a6a6a", muted: "#5a5a5a" } });
  assert.equal(contrast.code, 1);
  assert.equal(contrast.json.reason, "contrast");
});
