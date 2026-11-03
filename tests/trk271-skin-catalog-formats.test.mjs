// SPDX-License-Identifier: GPL-3.0-or-later
/* 🧙 trk271：目録の「形」が違っても同じように読めること。
   Skin 側から届いた 3 ファイル（catalog の JSON・生成物の .js・検査の道具 v2）を
   そのまま使えるようにした回の見張りです。
   ・`tools/lib/skin-catalog.mjs` が 4 つの形（目録 JSON・1 枚・パック・.js）を読む
   ・取り込みは、JSON からでも .js からでも同じバイト列になる
   ・`tools/check-cli-skin.mjs` は .js も `--catalog` も受ける・モジュールとして import できる */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT } from "./helpers/browser-data.mjs";
import { catalogFromJson, catalogFromJs, loadCatalogFile } from "../tools/lib/skin-catalog.mjs";

const SKIN = {
  id: "wizard-check", cat: ["wizard"],
  label: { ja: "見本", en: "Sample" }, desc: { ja: "見本", en: "Sample" },
  colors: {
    bg: "#101010", panel: "rgba(24,24,24,.97)", text: "#f0f0f0", accent: "#39ff14", gold: "#ffb000",
    muted: "#c8c8c8", field: "#151515", button: "#202020", onAccent: "#000000",
  },
  cli: { font: "Courier New, monospace", prompt: "λ", caret: "#39ff14", scan: 0.1, cursor: "block", opacity: 0.9, history: 60, completion: "tab", bell: true },
};
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "trk271-"));
const write = (dir, name, body) => { const p = path.join(dir, name); fs.writeFileSync(p, typeof body === "string" ? body : JSON.stringify(body)); return p; };

/* Skin 側の生成物と同じ形（配列＋ESM の書き出し）を作る */
function sidecarJs(skins) {
  const rows = skins.map(s => "  " + JSON.stringify(s)).join(",\n");
  return `// SPDX-License-Identifier: GPL-3.0-or-later
// 自動生成: tools/import-skin-catalog.mjs --cat=wizard
// 生成日時: 2026-11-03T01:17:20.725Z

const SKINS_WIZARD = [
${rows}
];

export { SKINS_WIZARD };
`;
}

/* ==================== 読み口 ==================== */
test("目録 JSON・1 枚・パック・配列のどれも読める", () => {
  assert.equal(catalogFromJson({ format: "trk-avatar-library-skins", skins: [SKIN] }).list.length, 1);
  assert.equal(catalogFromJson({ skins: [SKIN] }).shape, "catalog");
  assert.equal(catalogFromJson(SKIN).shape, "skin");
  assert.equal(catalogFromJson({ skin: SKIN }).shape, "pack");
  assert.equal(catalogFromJson([SKIN]).shape, "array");
  assert.equal(catalogFromJson({ nothing: true }), null);
});

test("生成物の .js（const ＋ ESM の export）も読める", () => {
  const got = catalogFromJs(sidecarJs([SKIN]));
  assert.equal(got.error, undefined);
  assert.equal(got.list.length, 1);
  assert.equal(got.list[0].id, "wizard-check");
  /* export が無くても読める（module.exports も可） */
  assert.equal(catalogFromJs(`const SKINS_WIZARD = ${JSON.stringify([SKIN])};`).list.length, 1);
  assert.equal(catalogFromJs(`module.exports = ${JSON.stringify([SKIN])};`).list.length, 1);
});

test("生成物の .js（`S[\"id\"] = { … }`）も読める（trk273：鍵を id として補う）", () => {
  const { id, ...rest } = SKIN;
  const file = `"use strict";\n(() => {\n  const S = window.Trk.data.SKINS;\n  S[${JSON.stringify(id)}] = {\n` +
    Object.entries(rest).map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`).join("\n") +
    "\n  };\n})();\n";
  const got = catalogFromJs(file);
  assert.equal(got.error, undefined, got.error);
  assert.equal(got.list.length, 1);
  assert.equal(got.list[0].id, id);
  assert.deepEqual(got.list[0].colors, SKIN.colors);
});

test("コメント・末尾カンマ・単一引用符・引用符なしの鍵を読める", () => {
  const file = `// 生成物
const SKINS_WIZARD = [
  /* 1 枚目 */
  {
    id: 'wizard-one',
    cat: ['wizard',],
    colors: { bg: '#101010', text: '#f0f0f0', },
  },
];
export { SKINS_WIZARD };
`;
  const got = catalogFromJs(file);
  assert.equal(got.error, undefined, got.error);
  assert.equal(got.list[0].id, "wizard-one");
  assert.deepEqual(got.list[0].cat, ["wizard"]);
  assert.equal(got.list[0].colors.text, "#f0f0f0");
});

test("式・関数・テンプレート文字列は、評価せずに断る（trk273・レビュー M2）", () => {
  for (const body of [
    "const SKINS_WIZARD = [ makeSkin() ];",
    "const SKINS_WIZARD = [ { id: \"x\", cat: SOME } ];",
    "const SKINS_WIZARD = [ { id: `x` } ];",
  ]) {
    const got = catalogFromJs(body);
    assert.ok(got.error, body + " は読めてはいけない: " + JSON.stringify(got.list));
  }
});

test("信用しない .js は、読ませても実行しない（レビュー M2 のペイロード）", () => {
  const dir = tmp();
  const victim = path.join(dir, "escaped.txt");
  const payload = [
    `const p = Object.constructor("return process")();`,
    `p.getBuiltinModule("fs").writeFileSync(${JSON.stringify(victim)}, "pid " + p.pid);`,
    `const SKINS_WIZARD = []; export { SKINS_WIZARD };`,
  ].join("\n");
  const got = catalogFromJs(payload);
  assert.equal(fs.existsSync(victim), false, "評価していたら（vm 経由でも）ファイルが作られてしまう");
  /* 空の配列は「読めた」扱いになる（中身が無いだけ）。実行されていないことが肝心 */
  assert.equal(got.error === undefined ? got.list.length : 0, 0);
});

test("読めないものは、理由付きで断る（例外で落ちない）", () => {
  assert.match(catalogFromJs("const x = 1;").error, /配列/);
  assert.match(catalogFromJs("this is not js (((").error, /\S/);
  const dir = tmp();
  const broken = write(dir, "broken.json", "{ not json");
  assert.match(loadCatalogFile(broken).error, /読めません/);
  const wrongShape = write(dir, "wrong.json", { hello: "world" });
  assert.match(loadCatalogFile(wrongShape).error, /形が違います/);
});

test("ファイルの種類は、拡張子ではなく中身で見分ける", () => {
  const dir = tmp();
  const jsAsJson = write(dir, "cat.json", sidecarJs([SKIN]));   /* 拡張子だけ JSON */
  assert.equal(loadCatalogFile(jsAsJson).shape, "js");
  const jsonAsJs = write(dir, "cat.js", JSON.stringify({ skins: [SKIN] }));   /* 拡張子だけ .js */
  assert.equal(loadCatalogFile(jsonAsJs).shape, "catalog");
});

/* ==================== 取り込みは同じバイト列 ==================== */
function importFrom(file, extra = []) {
  const dir = path.dirname(file);
  const out = path.join(dir, "out-" + path.basename(file) + ".js");
  const stdout = execFileSync(process.execPath, [
    path.join(ROOT, "tools/import-skin-catalog.mjs"), file, "--cat=wizard", "--out=" + path.relative(ROOT, out), ...extra,
  ], { encoding: "utf8", cwd: ROOT });
  return { stdout, file: fs.readFileSync(out, "utf8") };
}

test("JSON からでも .js からでも、同じスキンが同じバイト列で出る", () => {
  const dir = tmp();
  const json = write(dir, "skins.json", { format: "trk-avatar-library-skins", version: 1, skins: [SKIN] });
  const js = write(dir, "skins.js", sidecarJs([SKIN]));
  const a = importFrom(json);
  const b = importFrom(js);
  /* 先頭のコメント（作り方の行＝出力先の道）だけは違ってよい。スキンの表は同じ */
  const body = t => t.replace(/^.*(作り方|入力).*$/gm, "");
  assert.equal(body(a.file), body(b.file), "形が違っても同じ生成物");
  assert.match(a.file, /S\["wizard-check"\]/);
  /* .js は timestamp を持っているが、生成物には持ち込まない（同じ目録なら同じバイト列） */
  assert.doesNotMatch(a.file, /2026-11-03T01:17/);
});

test("1 枚の JSON でも、パックの JSON でも取り込める（1 種だけ）", () => {
  const dir = tmp();
  const one = write(dir, "one.json", SKIN);
  const pack = write(dir, "pack.json", { skin: SKIN });
  assert.match(importFrom(one).file, /S\["wizard-check"\]/);
  assert.match(importFrom(pack).file, /S\["wizard-check"\]/);
});

/* ==================== 検査の道具（v3） ==================== */
function runTool(args) {
  try {
    const stdout = execFileSync(process.execPath, [path.join(ROOT, "tools/check-cli-skin.mjs"), ...args], { encoding: "utf8", cwd: ROOT });
    return { code: 0, out: stdout, json: args.includes("--json") ? JSON.parse(stdout) : null };
  } catch (e) {
    return { code: e.status, out: e.stdout || "", json: args.includes("--json") && e.stdout ? JSON.parse(e.stdout) : null };
  }
}

test("道具：.js の目録も、JSON と同じように判定する", () => {
  const dir = tmp();
  const json = write(dir, "skins.json", { skins: [SKIN] });
  const js = write(dir, "skins.js", sidecarJs([SKIN]));
  const a = runTool([json, "--json"]);
  const b = runTool([js, "--json"]);
  assert.equal(a.code, 0, a.out);
  assert.equal(b.code, 0, b.out);
  assert.equal(b.json.shape, "js");
  assert.deepEqual(b.json.problems, a.json.problems);
});

test("道具：--catalog で「名乗るものだけ」を見る（1 枚の JSON でも）", () => {
  const dir = tmp();
  /* 目録（skins[]）は自動で「名乗るものだけ」＝1 枚 */
  const mixed = write(dir, "mixed.json", { skins: [SKIN, { ...SKIN, id: "plain-one", cat: ["basic"], cli: undefined }] });
  const plain = runTool([mixed, "--json"]);
  assert.equal(plain.json.shape, "catalog");
  assert.equal(plain.json.skins.length, 1);
  assert.ok(plain.json.notes.some(n => /plain-one/.test(n)));
  /* 1 枚の JSON は既定では「その 1 枚」を見る。--catalog を付けると名乗りで判断して飛ばす */
  const one = write(dir, "one.json", { ...SKIN, id: "plain-one", cat: ["basic"] });
  assert.equal(runTool([one, "--json"]).json.skins.length, 1);
  const forced = runTool([one, "--json", "--catalog"]);
  assert.equal(forced.json.skins.length, 0);
  assert.equal(forced.json.ok, true);
});

test("道具：モジュールとして import できる（validateSkin・checkList・reasonFromErrors）", async () => {
  const mod = await import("../tools/check-cli-skin.mjs");
  const good = mod.validateSkin(SKIN, {});
  assert.equal(good.ok, true, JSON.stringify(good.bad));
  assert.equal(good.reason, "ok");
  const bad = mod.validateSkin({ ...SKIN, colors: { ...SKIN.colors, text: "#6a6a6a", muted: "#5a5a5a" } }, {});
  assert.equal(bad.ok, false);
  assert.equal(mod.reasonFromErrors(bad), "contrast");
  const res = mod.checkList([SKIN, { ...SKIN, id: "plain-one", cat: ["basic"] }], { fromCatalog: true });
  assert.equal(res.ok, true);
  assert.equal(res.skins.length, 1, "名乗らないものは判定しない");
  assert.ok(res.notes.some(n => /plain-one/.test(n)));
  /* import しただけでは、何も出力しない・終了しない（副作用なし） */
  assert.equal(typeof mod.main, "undefined", "main は外に出さない");
});

test("道具：外部 URL は「知らせるだけ」（落とさない）", () => {
  const dir = tmp();
  const withUrl = write(dir, "url.json", { skins: [{ ...SKIN, video: "url(https://example.com/a.mp4)" }] });
  const r = runTool([withUrl, "--json"]);
  assert.equal(r.code, 0, r.out);
  assert.ok(r.json.notes.some(n => /外部 URL/.test(n)), JSON.stringify(r.json.notes));
});

test("道具：読めないファイルは 2、直すところがあれば 1、通れば 0", () => {
  const dir = tmp();
  assert.equal(runTool([write(dir, "broken.json", "{ nope")]).code, 2);
  assert.equal(runTool([write(dir, "bad.json", { ...SKIN, colors: { ...SKIN.colors, text: "#555555" } })]).code, 1);
  assert.equal(runTool([write(dir, "good.json", SKIN)]).code, 0);
});
