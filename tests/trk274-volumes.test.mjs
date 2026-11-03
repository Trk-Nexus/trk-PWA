// SPDX-License-Identifier: GPL-3.0-or-later
/* 📚 trk274：巻別スキン 291 種の受け皿（データと道具）

   見張ること：
   ・目録の 291 種が、3 つのファイル（data.js 49＋ミク 4／Wizard 62／巻別 176）で**重複なく**そろう
   ・Wizard 62 種は既存 24 種を壊していない（22 種はそのまま・2 種は読みにくさの修正だけ）
   ・`SKIN_VOLUMES` の 13 巻が 291 種を覆い、同じ ID が 2 巻に入っていない
   ・棚の絞り込み（既定＝定番＋ウィザード／巻を選ぶ／すべて）
   ・取り込みの道具（`--only-new`・`--exclude-cat`・`--volumes`）と、生成物を検める道具 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { ROOT } from "./helpers/browser-data.mjs";

const wizardSrc = fs.readFileSync(path.join(ROOT, "js/skins-wizard.js"), "utf8");
const volumeSrc = fs.readFileSync(path.join(ROOT, "js/skins-volumes.js"), "utf8");
const coreSrc = fs.readFileSync(path.join(ROOT, "js/core.js"), "utf8");
const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

/* ---------- 画面なしで data.js ＋ 生成物を読む ---------- */
function loadWorld() {
  const sandbox = {
    console, Math, JSON, Object, Array, String, Number, Set, Map, Date, RegExp, Intl,
    parseInt, parseFloat, isNaN, isFinite,
    TEXT: { ja: {}, en: {}, zh: {}, ko: {} }, tr: () => "",
    document: {
      documentElement: { style: { setProperty() {} } }, getElementById: () => null,
      createElement: () => ({ style: {}, append() {}, addEventListener() {} }),
    },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of ["js/data.js", "js/characters/miku.js", "js/skins-wizard.js", "js/skins-volumes.js"]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), sandbox, { filename: f });
  }
  return sandbox.window.Trk.data;
}
const D = loadWorld();
const S = D.SKINS;
const plain = v => JSON.parse(JSON.stringify(v));
const ids = Object.keys(S);
const volumes = plain(D.SKIN_VOLUMES || []);
const VOLUME_ONLY = volumes.filter(g => g.id !== "wizard" && g.id !== "other").flatMap(g => g.ids);

/* ---------- 棚の判定（core.js の純粋な部分だけ） ---------- */
function extractFn(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${marker} がある`);
  const end = source.indexOf("\n}\n", start);
  assert.notEqual(end, -1, `${marker} の閉じかっこがある`);
  return source.slice(start, end + 3);
}
const shelfApi = (() => {
  const code = [
    extractFn(coreSrc, "const skinCatList = s =>").replace(/;$/, "") + ";",
    coreSrc.match(/const SKIN_ID_RE = .*;/)[0],
    extractFn(coreSrc, "function cleanSkinIdList("),
    extractFn(coreSrc, "function cleanSkinMap("),
    extractFn(coreSrc, "function skinSearchText("),
    extractFn(coreSrc, "function skinMatchesQuery("),
    extractFn(coreSrc, "function skinShelfEntries("),
  ].join("\n") + "\nthis.api = { skinShelfEntries };";
  const sandbox = { console, Math, JSON, Object, Array, String, Number, Set, Map, Date };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "core.js#shelf" });
  return sandbox.api;
})();
const shelfIds = opt => Array.from(shelfApi.skinShelfEntries(S, { locale: "ja", ...opt }), p => p[0]);

/* ==================== 291 種がそろう ==================== */
test("291 種：内蔵 53＋Wizard 62＋巻別 176 が、重複なくそろう", () => {
  const builtin = Object.keys(loadWorldWithoutGenerated().SKINS);
  assert.equal(builtin.length, 53, "data.js 49＋ミク 4");
  assert.equal(ids.length, 291);
  assert.equal(ids.length, builtin.length + 62 + 176);
  const wizardIds = ids.filter(id => (S[id].cat || []).includes("wizard"));
  assert.equal(wizardIds.length, 62);
  /* 同じ id が 2 回書かれていないこと（生成物の行数で数える） */
  const countOf = t => (t.match(/^ {2}S\["[A-Za-z0-9_.-]+"\] = \{/gm) || []).length;
  assert.equal(countOf(wizardSrc), 62);
  assert.equal(countOf(volumeSrc), 176);
});
function loadWorldWithoutGenerated() {
  const sandbox = {
    console, Math, JSON, Object, Array, String, Number, Set, Map, Date, RegExp, Intl,
    parseInt, parseFloat, isNaN, isFinite,
    TEXT: { ja: {}, en: {}, zh: {}, ko: {} }, tr: () => "",
    document: {
      documentElement: { style: { setProperty() {} } }, getElementById: () => null,
      createElement: () => ({ style: {}, append() {}, addEventListener() {} }),
    },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of ["js/data.js", "js/characters/miku.js"]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), sandbox, { filename: f });
  }
  return sandbox.window.Trk.data;
}

test("目録から作ったファイルは、手で直さない・どこから来たか分かる", () => {
  for (const [name, src] of [["js/skins-wizard.js", wizardSrc], ["js/skins-volumes.js", volumeSrc]]) {
    assert.match(src, /tools\/import-skin-catalog\.mjs/, `${name}：作り方が書いてある`);
    assert.match(src, /手で直さないでください/, name);
    assert.match(src, /目録の sha256：[0-9a-f]{64}/, `${name}：目録の指紋が書いてある`);
    assert.doesNotMatch(src, /\\\\"/, `${name}：font の \\" が残っています`);
  }
});

/* ==================== 既存 24 種を壊していない ==================== */
test("Wizard 24 種は、22 種がそのまま・2 種だけ読みにくさを直した", () => {
  /* trk270 で入れた 24 種のうち、値が変わってよいのはこの 2 種だけ（どちらも元データが読めない組） */
  /* ・wizard-hermetic：舞台 #b8860b の上に文字 #fffdf0（3.19:1）。
     trk275（レビュー Q2）で**寄せ幅の上限**を入れたため、この 1 種は寄せずに
     **目録の色のまま**（舞台 #b8860b）＋差し戻し（既定の棚から外す）になりました。 */
  assert.equal(S["wizard-hermetic"].game.stage, "#b8860b");
  assert.equal(S["wizard-hermetic"].holdback, true, "寄せずに差し戻す");
  /* ・wizard-void：舞台 #000000 の上に文字 #000000（1.00:1）→ 文字を #ffffff に */
  assert.equal(S["wizard-void"].game.ink, "#ffffff");
  /* それ以外の 22 種は trk270 の値のまま（代表 4 種） */
  assert.equal(S["wizard-alchemy"].ui["--ui-text"], "#d4af37");
  assert.equal(S["wizard-alchemy"].ui["--ui-button"], "#583d34");
  assert.equal(S["wizard-cauldron"].ui["--ui-text"], "#a5d6a7");
  assert.equal(S["wizard-arcane"].ui["--ui-bg"], "#1a052e");
  assert.equal(S["wizard-nord"].ui["--ui-muted"], "#c7dedd");
});

/* ==================== 巻の目録 ==================== */
test("SKIN_VOLUMES は 13 巻で、291 種を重複なく覆う", () => {
  assert.equal(volumes.length, 13);
  const all = volumes.flatMap(g => g.ids);
  assert.equal(all.length, 291);
  assert.equal(new Set(all).size, 291, "同じ ID が 2 巻に入っていない");
  for (const g of volumes) {
    assert.match(g.id, /^[a-z][a-z0-9-]{1,23}$/);
    assert.ok(g.title && g.title.length <= 60, `${g.id} に見出し`);
    for (const id of g.ids) assert.ok(S[id], `${g.id} の ${id} がスキンに居る`);
  }
  const byId = Object.fromEntries(volumes.map(g => [g.id, g]));
  assert.equal(byId["vol-01"].ids.length, 16);
  assert.equal(byId["vol-01"].title, "vol.1 夜の情景と光の色彩");
  assert.equal(byId.wizard.ids.length, 62);
  assert.equal(byId.other.ids.length, 53, "その他＝こちらの定番（新しい保存キーではありません）");
});

/* ==================== 棚の絞り込み ==================== */
test("棚の既定は「定番」だけ（wizard も巻を選んだときだけ。trk280）", () => {
  const def = shelfIds({ volumes });
  /* ⚖ trk280：ご相談により、ウィザードを既定の棚から外しました（初見の驚きを残す）。
     既定＝その他・定番（other）の 53 種。差し戻しは other に居ないので減りません。 */
  assert.equal(def.length, 53, "定番（other）だけ");
  assert.equal(def.filter(id => VOLUME_ONLY.includes(id)).length, 0);
  assert.ok(def.includes("shadow"), "定番は出る");
  assert.ok(!def.includes("wizard-cli"), "ウィザードは既定では出ない");
});

test("巻を選ぶと、その巻だけが出る", () => {
  const vol2 = volumes.find(g => g.id === "vol-02");
  const got = shelfIds({ volumes, vol: "vol-02" });
  assert.deepEqual(got.sort(), vol2.ids.slice().sort());
  const glitch = shelfIds({ volumes, vol: "glitch" });
  assert.equal(glitch.length, 16);
  const other = shelfIds({ volumes, vol: "other" });
  assert.equal(other.length, 53);
});

test("「すべての巻」で 291 種。知らない巻の名前は既定に戻る", () => {
  assert.equal(shelfIds({ volumes, vol: "all" }).length, 291);
  assert.equal(shelfIds({ volumes, vol: "vol-99" }).length, 53, "知らない巻名は既定扱い（定番）");
  /* 巻の目録が無い（古い版のキャッシュ）ときも壊れない。
     差し戻しの 18 種は既定の棚に出さないので、そのぶん減る（trk275） */
  assert.equal(shelfIds({ volumes: [] }).length, 212, "目録が無いときも wizard は出さない（273 − wizard 62。trk280）");
});

test("巻の絞り込みは、カテゴリ・⭐・検索と重ねられる", () => {
  const dark = shelfIds({ volumes, vol: "vol-01", cat: "dark" });
  assert.ok(dark.every(id => (S[id].cat || []).includes("dark")));
  const q = shelfIds({ volumes, vol: "vol-02", query: "ruby" });
  assert.deepEqual(q, ["ruby"]);
});

/* ==================== trk275：レビュー M2 の番人（3 本） ==================== */
test("巻の外にある「いま使っているスキン」は、棚から消えない（M2-a）", () => {
  /* vol.2 の amber を当てたまま、既定の棚に戻す */
  const list = shelfIds({ volumes, vol: "", current: "amber" });
  assert.ok(list.includes("amber"), "使用中のスキンは巻の外でも残る");
  assert.equal(list.length, 53 + 1, "既定 53 に 1 枚だけ足される");
  /* 巻を選んでいても同じ（amber は vol.2。vol.1 を選んでいても残す） */
  assert.ok(shelfIds({ volumes, vol: "vol-01", current: "amber" }).includes("amber"));
});

test("⭐・🕒・🚫 の絞り込みは、巻の外も見る（M2-b）", () => {
  /* ⭐ を付けた amber（vol.2）を、既定の巻で絞っても出す */
  assert.deepEqual(shelfIds({ volumes, vol: "", only: "fav", fav: ["amber"] }), ["amber"]);
  /* 🕒 も同じ（ruby は vol.2） */
  assert.deepEqual(shelfIds({ volumes, vol: "", only: "recent", last: { ruby: 1 } }), ["ruby"]);
  /* 🚫 の一覧も、巻で切り落とさない */
  assert.deepEqual(shelfIds({ volumes, vol: "", only: "hidden", hidden: ["absinthe"] }), ["absinthe"]);
});

test("検索は巻をまたぐ（M2-c）：既定の棚で「ruby」が見つかる", () => {
  assert.deepEqual(shelfIds({ volumes, vol: "", query: "ruby" }), ["ruby"]);
  /* 巻を選んでいるときも、検索が入れば巻で切り落とさない（「0 枚」で驚かせない） */
  assert.deepEqual(shelfIds({ volumes, vol: "vol-01", query: "ruby" }), ["ruby"]);
});

/* ==================== trk275：差し戻し（Q2） ==================== */
test("差し戻しの 18 種は、生成物が自分で名乗り・既定の棚に出ない", () => {
  const hb = ids.filter(id => S[id].holdback);
  assert.equal(hb.length, 18, "18 種（Wizard 1＋巻別 17）");
  for (const [name, src] of [["js/skins-wizard.js", wizardSrc], ["js/skins-volumes.js", volumeSrc]]) {
    const m = /SKIN_HOLDBACK = \[([^\]]*)\]/.exec(src);
    assert.ok(m, `${name}：SKIN_HOLDBACK を書いている`);
    for (const id of [...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1])) {
      assert.equal(S[id].holdback, true, `${id}：名乗りと印が一致`);
    }
  }
  for (const id of hb) assert.ok(!shelfIds({ volumes, vol: "" }).includes(id), `${id} は既定の棚に出ない`);
  for (const id of hb) assert.ok(shelfIds({ volumes, vol: "all" }).includes(id), `${id} は ALL では見える`);
});

/* ==================== 取り込みの道具 ==================== */
function runTool(args) {
  return execFileSync(process.execPath, [path.join(ROOT, "tools/import-skin-catalog.mjs"), ...args], {
    encoding: "utf8", cwd: ROOT,
  });
}
const COLORS = { bg: "#101820", panel: "#182030", text: "#f2f5fa", accent: "#7fd8ff", gold: "#ffd166", muted: "#b8c4d6", field: "#0d141f", button: "#1d2739", onAccent: "#001018" };
function tmpCatalog(skins) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trk274-"));
  const file = path.join(dir, "skins.json");
  fs.writeFileSync(file, JSON.stringify({ format: "trk-avatar-library-skins", version: 1, skins }));
  return { dir, file };
}
const VOLUMES_JSON = {
  version: 1,
  groups: [
    { id: "vol-01", title: "vol.1 テスト", ids: ["cam-a", "cam-b"] },
    { id: "wizard", title: "wizard テスト", category: "wizard" },
    { id: "other", title: "その他", remaining: true },
  ],
};

test("道具：--exclude-cat と --volumes で「巻の目録」も一緒に出る", () => {
  const { dir, file } = tmpCatalog([
    { id: "cam-a", cat: ["basic"], colors: COLORS, label: { ja: "A" }, desc: { ja: "a" } },
    { id: "cam-b", cat: ["dark"], colors: COLORS, label: { ja: "B" }, desc: { ja: "b" } },
    { id: "wiz-x", cat: ["wizard"], colors: COLORS, label: { ja: "X" }, desc: { ja: "x" } },
  ]);
  const volFile = path.join(dir, "volumes.json");
  fs.writeFileSync(volFile, JSON.stringify(VOLUMES_JSON));
  const out = path.join(dir, "volumes.js");
  runTool([file, "--cat=", "--exclude-cat=wizard", "--volumes=" + volFile, "--kind=volumes", "--out=" + out]);
  const src = fs.readFileSync(out, "utf8");
  assert.match(src, /S\["cam-a"\]/);
  assert.doesNotMatch(src, /S\["wiz-x"\]/, "wizard は別ファイル");
  assert.match(src, /SKIN_VOLUMES = \[/);
  const listed = [...src.matchAll(/\{id:"([a-z0-9-]+)",title:"[^"]*",ids:\[([^\]]*)\]\}/g)].map(m => [m[1], (m[2].match(/"/g) || []).length / 2]);
  assert.deepEqual(listed, [["vol-01", 2], ["wizard", 1], ["other", 0]]);
  /* 何度流しても同じバイト列（--check が見張れる） */
  runTool([file, "--cat=", "--exclude-cat=wizard", "--volumes=" + volFile, "--kind=volumes", "--out=" + out, "--check"]);
});

test("道具：--only-new は、本体が既に持っている ID を書かない", () => {
  const { dir, file } = tmpCatalog([
    { id: "shadow", cat: ["basic"], colors: COLORS, label: { ja: "影" }, desc: { ja: "s" } },
    { id: "cam-a", cat: ["basic"], colors: COLORS, label: { ja: "A" }, desc: { ja: "a" } },
  ]);
  const out = path.join(dir, "new.js");
  const stdout = runTool([file, "--cat=", "--only-new", "--out=" + out]);
  const src = fs.readFileSync(out, "utf8");
  assert.match(src, /S\["cam-a"\]/);
  assert.doesNotMatch(src, /S\["shadow"\]/, "data.js が持っている shadow は上書きしない");
  assert.match(stdout, /既にあるので書かない：1 件/);
});

test("道具：グラデーションの地は、全停止点が合格するまで寄せる（1 色に潰さない）", () => {
  const { dir, file } = tmpCatalog([{
    id: "cam-grad", cat: ["basic"], label: { ja: "G" }, desc: { ja: "g" },
    colors: { ...COLORS, bg: "linear-gradient(180deg,#4a1e1e,#2a0f0f)", stage: "linear-gradient(180deg,#b87333,#4a1e1e)" },
  }]);
  const out = path.join(dir, "grad.js");
  runTool([file, "--cat=", "--out=" + out]);
  const src = fs.readFileSync(out, "utf8");
  assert.match(src, /"--ui-bg":"linear-gradient\(180deg,#/, "地はグラデーションのまま");
  assert.match(src, /"stage":"linear-gradient\(180deg,#/, "舞台もグラデーションのまま");
});

/* ==================== 検める道具（E-6） ==================== */
function runChecker(args) {
  try {
    const stdout = execFileSync(process.execPath, [path.join(ROOT, "tools/check-skin-contrast.mjs"), ...args], { encoding: "utf8", cwd: ROOT });
    return { code: 0, stdout };
  } catch (e) {
    return { code: e.status, stdout: e.stdout || "" };
  }
}

test("検める道具：送った 2 つの生成物は、全部合格", () => {
  const r = runChecker([]);
  assert.equal(r.code, 0, r.stdout);
  assert.match(r.stdout, /js\/skins-wizard\.js：62 種/);
  assert.match(r.stdout, /js\/skins-volumes\.js：176 種＋巻の目録 13/);
});

test("検める道具：読めない組は、ちゃんと落とす（見張りが効く）", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trk274-bad-"));
  const bad = path.join(dir, "bad.js");
  fs.writeFileSync(bad, `"use strict";\n(() => {\n  const S = window.Trk.data.SKINS;\n  S["bad-one"] = {\n    ui:{"--ui-bg":"#ffffff","--ui-panel":"#ffffff","--ui-soft":"rgba(0,0,0,.05)","--ui-text":"#fefefe","--ui-muted":"#fdfdfd","--ui-border":"rgba(0,0,0,.2)","--ui-button":"#ffffff","--ui-button-hover":"#ffffff","--ui-field":"#ffffff","--ui-accent":"#ffff00","--ui-on-accent":"#ffffff","--ui-gold":"#ffffff"},\n    game:{"stage":"#ffffff","ink":"#ffffff","miss":"#fefefe"}\n  };\n})();\n`);
  const r = runChecker([bad, "--json"]);
  assert.equal(r.code, 1);
  const json = JSON.parse(r.stdout);
  assert.equal(json.ok, false);
  assert.ok(json.problems.some(p => /本文.*地/.test(p.label)), "文字と地の組を名指しする");
  assert.ok(json.problems.some(p => p.reason === "contrast"));
});

test("検める道具：生成物ではない .js は「読めない」で止まる（黙って合格にしない）", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trk274-empty-"));
  const empty = path.join(dir, "empty.js");
  fs.writeFileSync(empty, `"use strict";\n// 何も無い\n`);
  const r = runChecker([empty]);
  assert.equal(r.code, 1);
});
