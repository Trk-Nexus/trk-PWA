// SPDX-License-Identifier: GPL-3.0-or-later
/* trk315: 🔤 題字の書体（利用者が導入する書体ファイル）
   守りたい約束：
     ・書体ファイルはリポジトリに入れない（同梱しない・自動取得しない）
     ・導入は固定版のハッシュ（SHA-256）と完全一致したものだけ。別版・別ファイルは拒否
     ・必要なファイルがすべて揃って読めたときだけ適用。欠けた・壊れた・保存失敗では適用しない
     ・適用は題字（.brand h1）と作品名一覧（#skinGrid .skinCard b）だけ。本文などには触らない
     ・外すと class と変数が消えて元に戻る
     ・ライセンス全文は固定版（fonts/licenses）から読め、ハッシュが宣言と一致する */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const src = fs.readFileSync(`${ROOT}/js/title-font.js`, "utf8");
const css = fs.readFileSync(`${ROOT}/css/style.css`, "utf8");
const html = fs.readFileSync(`${ROOT}/index.html`, "utf8");
const i18n = fs.readFileSync(`${ROOT}/js/i18n.js`, "utf8");

function sha256File(p) { return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); }

/* 本体の定義だけを取り出して検査する（ブラウザの API は使わない） */
function candidatesFromSource() {
  const start = src.indexOf("const CANDIDATES = [");
  const end = src.indexOf("];", start);
  const body = src.slice(start + "const CANDIDATES = ".length, end + 1);
  return vm.runInNewContext("(" + body + ")");
}

describe("候補と固定版（書体本体は同梱しない）", () => {
  const cands = candidatesFromSource();

  test("候補は3つ。既定は Galmuri11（おすすめ）", () => {
    assert.equal(cands.map(c => c.id).join(), "galmuri,dotneo,press");
    assert.equal(cands.filter(c => c.recommended).map(c => c.id).join(), "galmuri");
  });

  test("各書体ファイルは SHA-256 と bytes を宣言し、家族名は衝突しない", () => {
    const families = new Set();
    for (const c of cands) for (const f of c.files) {
      assert.match(f.sha256, /^[0-9a-f]{64}$/);
      assert.ok(Number.isInteger(f.bytes) && f.bytes > 0);
      assert.ok(!families.has(f.family), f.family);
      families.add(f.family);
    }
  });

  test("ライセンス本文は fonts/licenses にあり、宣言したハッシュと一致する", () => {
    for (const c of cands) for (const L of c.licences) {
      const p = path.join(ROOT, L.path);
      assert.ok(fs.existsSync(p), L.path);
      assert.equal(sha256File(p), L.sha256, L.path);
    }
  });

  test("書体ファイル（.woff2 / .ttf）はリポジトリに置いていない", () => {
    const hits = [];
    const walk = dir => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name === "node_modules" || e.name === ".git" || e.name === "google_drive") continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(woff2?|ttf|otf)$/i.test(e.name)) hits.push(path.relative(ROOT, p));
      }
    };
    walk(ROOT);
    assert.deepEqual(hits, []);
  });
});

describe("画面への接続", () => {
  test("適用は題字と作品名一覧だけ（本文・他の見出しに書かない）", () => {
    const rule = css.split("\n").find(l => l.includes("--trk-title-font)}") && l.startsWith("body.trk-title-font-on"));
    assert.ok(rule, "scoped rule missing");
    assert.equal(rule, "body.trk-title-font-on .brand h1,body.trk-title-font-on #skinGrid .skinCard b{font-family:var(--trk-title-font)}");
  });

  test("index.html に欄と読み込みがある（trk246 の後）", () => {
    assert.ok(html.includes('id="titleFontPanel"'));
    const a = html.indexOf('src="js/typography.js"'), b = html.indexOf('src="js/title-font.js"');
    assert.ok(a > 0 && b > a);
  });

  test("欄の文言キー（tf…）は ja と en の両方にある", () => {
    const used = [...new Set([...src.matchAll(/"(tf[A-Z][A-Za-z]*)"/g)].map(m => m[1]))];
    const ja = i18n.slice(i18n.indexOf("  ja: {"), i18n.indexOf("  en: {"));
    const en = i18n.slice(i18n.indexOf("  en: {"), i18n.indexOf("  zh: {"));
    assert.ok(used.length >= 20, "keys found: " + used.length);
    for (const k of used) {
      assert.ok(ja.includes(k + ":"), "ja: " + k);
      assert.ok(en.includes(k + ":"), "en: " + k);
    }
  });
});

describe("振る舞い（ブラウザなしの最小確認）", () => {
  function load({ storage = {}, indexedDBOK = false, cryptoOK = true } = {}) {
    const style = Object.create(null), classes = new Set(), fontsAdded = [];
    const sandbox = {
      console,
      window: {},
      localStorage: {
        getItem: k => (k in storage ? storage[k] : null),
        setItem: (k, v) => { storage[k] = String(v); },
        removeItem: k => { delete storage[k]; }
      },
      indexedDB: indexedDBOK ? {} : undefined,
      crypto: cryptoOK ? crypto.webcrypto : undefined,
      document: {
        readyState: "complete",
        getElementById: () => null,
        fonts: { add: f => fontsAdded.push(f), delete: () => true },
        body: { classList: { add: c => classes.add(c), remove: c => classes.delete(c) } },
        documentElement: { style: { setProperty: (k, v) => { style[k] = v; }, removeProperty: k => { delete style[k]; } } }
      },
      FontFace: class { constructor() { } async load() { throw new Error("no font"); } },
      Uint8Array, ArrayBuffer, Date, Promise, Set, Object, Array, JSON, Math, Number, String, Error
    };
    sandbox.addEventListener = () => { };
    sandbox.window = sandbox;
    vm.runInNewContext(src, sandbox);
    return { api: sandbox.Trk.titleFont, style, classes, fontsAdded };
  }

  test("選んでいなければ何もせず、class も変数も付けない", async () => {
    const h = load();
    const st = await h.api.refresh();
    assert.equal(st.status, "off");
    assert.equal(h.classes.has("trk-title-font-on"), false);
    assert.equal(h.style["--trk-title-font"], undefined);
  });

  test("保存が使えないと、選んでも適用しない（状態は error）", async () => {
    const h = load({ storage: { trkTitleFont: "galmuri" }, indexedDBOK: false });
    const st = await h.api.refresh();
    assert.equal(st.status, "error");
    assert.equal(h.classes.has("trk-title-font-on"), false);
    assert.equal(h.style["--trk-title-font"], undefined);
  });

  test("版が違うファイルは拒否（保存はしない・理由は mismatch）", async () => {
    const h = load({ indexedDBOK: true });
    const bogus = { arrayBuffer: async () => new TextEncoder().encode("not a font").buffer };
    const r = await h.api.importFile("galmuri", "galmuri11", bogus);
    assert.equal(r.ok, false);
    assert.equal(r.reason, "mismatch");
  });

  test("候補やファイルの名前が知らないものなら拒否", async () => {
    const h = load({ indexedDBOK: true });
    const r = await h.api.importFile("nope", "x", { arrayBuffer: async () => new ArrayBuffer(1) });
    assert.equal(r.reason, "unknown");
  });

  test("choose は、揃っていない候補には切り替えない（以前の選択を残す）。知らない値は「使わない」", async () => {
    const storage = { trkTitleFont: "" };
    const h = load({ storage, indexedDBOK: false });
    const r = await h.api.choose("galmuri");
    assert.equal(r.ok, false);
    assert.equal(r.reason, "notReady");
    assert.equal(storage.trkTitleFont, "");
    await h.api.choose("<script>");
    assert.equal(storage.trkTitleFont, undefined);
  });

  test("導入は1ファイルの上限（1 MiB）を超えたら読まずに拒否", async () => {
    const h = load({ indexedDBOK: true });
    const big = { size: 2 * 1048576, arrayBuffer: async () => new ArrayBuffer(8) };
    const r = await h.api.importFile("galmuri", "galmuri11", big);
    assert.equal(r.reason, "size");
  });

  test("別のタブへの通知と storage の変化を読み直す仕組みがある", () => {
    assert.match(src, /new BroadcastChannel\(CHANNEL\)/);
    assert.match(src, /addEventListener\("storage"/);
  });

  test("削除は1つのトランザクションにまとめる（部分削除をしない）", () => {
    const body = src.slice(src.indexOf("async function removeCandidate"), src.indexOf("async function ready"));
    assert.equal((body.match(/transaction\(STORE/g) || []).length, 1);
  });

  test("モバイル版の対象にライセンス全文があり、先読みにも入っている", () => {
    const prep = fs.readFileSync(`${ROOT}/tools/prepare-mobile-web.mjs`, "utf8");
    const sw = fs.readFileSync(`${ROOT}/sw.js`, "utf8");
    assert.match(prep, /"fonts\/licenses"/);
    for (const f of ["Galmuri11-OFL.txt", "DotGothic16-OFL.txt", "NeoDunggeunmo-LICENSE.txt", "PressStart2P-OFL.txt"]) {
      assert.ok(sw.includes("fonts/licenses/" + f), f);
    }
  });

  test("ライセンス本文の場所は fonts/licenses の固定パスだけ（外部 URL を含まない）", () => {
    const cands = candidatesFromSource();
    for (const c of cands) for (const L of c.licences) {
      assert.match(L.path, /^fonts\/licenses\/[A-Za-z0-9._-]+$/);
    }
  });
});

describe("導入後の選択肢と作品ごとの受け口（trk315 追補）", () => {
  test("既定は「使わない」のまま。導入の選択肢は文言（ja・en）にあり、既定の値を変えていない", () => {
    const offerSrc = src;
    assert.match(offerSrc, /let offerId = ""/);
    assert.match(offerSrc, /offerId = c\.id/);
    assert.match(offerSrc, /tfOfferUse/);
    assert.match(offerSrc, /tfOfferKeep/);
    const i18n = fs.readFileSync(`${ROOT}/js/i18n.js`, "utf8");
    for (const k of ["tfOfferTitle", "tfOfferBody", "tfOfferUse", "tfOfferKeep"]) {
      assert.ok(i18n.indexOf(k + ":") > 0, k);
    }
  });

  test("作品ごとの指定：既定は全体の選択に従う。保存・消去・不正な値の拒否", () => {
    const storage = {};
    const sandbox = {
      console, window: {}, localStorage: {
        getItem: k => (k in storage ? storage[k] : null),
        setItem: (k, v) => { storage[k] = String(v); },
        removeItem: k => { delete storage[k]; }
      }, document: { readyState: "complete", getElementById: () => null, body: null, documentElement: null, fonts: { add() { }, delete() { } } },
      Uint8Array, ArrayBuffer, Date, Promise, Set, Object, Array, JSON, Math, Number, String, Error
    };
    sandbox.addEventListener = () => { };
    sandbox.window = sandbox;
    vm.runInNewContext(src, sandbox);
    const api = sandbox.Trk.titleFont;
    assert.equal(api.fontForWork("pixel-console"), "", "first");
    assert.equal(api.setWorkFont("pixel-console", "galmuri"), true, "set");
    assert.equal(api.fontForWork("pixel-console"), "galmuri");   // 保存された候補IDを返す（適用前の確認は呼び出し側）
    assert.equal(api.fontForWork("other-work"), "");              // 指定のない作品は全体の選択（既定は使わない）
    assert.equal(api.setWorkFont("__proto__", "galmuri"), false);
    assert.equal(api.setWorkFont("x", "<script>"), false);
    assert.equal(api.setWorkFont("", "galmuri"), false);
    assert.equal(api.setWorkFont("pixel-console", ""), true);
    assert.equal(JSON.parse(storage[api.WORKS_KEY]).hasOwnProperty("pixel-console"), false);
  });
});
