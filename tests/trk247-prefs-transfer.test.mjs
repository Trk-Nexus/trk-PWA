// SPDX-License-Identifier: GPL-3.0-or-later
/* trk247: 📤 設定の書き出し・📥 読み込みの実体を直す（Phase 4 の ③）

   直したかったのは3つ：
   1. **上限の不一致** – まるごとバックアップは設定JSONを 20 MiB まで読むのに、
      設定1本の読み込みだけ 2 MiB で縛られていた（＝自分の書き出しを自分が読み返せない）。
   2. **1項目の例外で全体が消える** – notes の検査などが投げると外側の catch に落ち、
      「読み込み失敗」だけで何も適用されない（部分適用の考え方が無かった）。
   3. **導線が 🛟 にしか無い** – ⚙ → 💾 端末の保存 には「保存を固定する」しかなかった。 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const coreSrc = fs.readFileSync(`${ROOT}/js/core.js`, "utf8");
const backupSrc = fs.readFileSync(`${ROOT}/js/backup.js`, "utf8");
const html = fs.readFileSync(`${ROOT}/index.html`, "utf8");
const i18nSrc = fs.readFileSync(`${ROOT}/js/i18n.js`, "utf8");
const swSrc = fs.readFileSync(`${ROOT}/sw.js`, "utf8");
const guardSrc = fs.readFileSync(`${ROOT}/tools/check-security.mjs`, "utf8");

/* vm の別 realm で作られた値は assert.strict の deepEqual に通らないので、JSON で往復させてから比べる */
const J = x => JSON.parse(JSON.stringify(x));

/* 純関数の中身だけを切り出して、同じものを vm で動かす（検査と実装が離れないため） */
function loadPicker() {
  const start = coreSrc.indexOf("function pickImportedPrefs(");
  const end = coreSrc.indexOf("function validImportedSettingEnum(", start);
  assert.ok(start > 0 && end > start, "pickImportedPrefs が切り出せる");
  const sandbox = {
    UNSAFE_KEYS: new Set(["__proto__", "constructor", "prototype"]),
    SETTING_ENUM_KEYS: ["specStyle", "trkTabName"],
    console
  };
  vm.runInNewContext(coreSrc.slice(start, end) + "\nthis.pickImportedPrefs = pickImportedPrefs;", sandbox);
  return sandbox.pickImportedPrefs;
}

describe("上限（自分の書き出しを読み戻せる）", () => {
  test("PREFS_IMPORT_MAX は 2 MiB のままにしない", () => {
    const m = coreSrc.match(/const PREFS_IMPORT_MAX = ([^;]+);/);
    assert.ok(m, "上限が1か所で決まっている");
    assert.ok(!/2 \* 1024 \* 1024/.test(m[1]), `2 MiB のまま (${m[1]})`);
    const bytes = vm.runInNewContext(`(${m[1]})`);
    assert.ok(bytes >= 20 * 1024 * 1024, `少なくともまるごとバックアップと同じ目盛り（いまで ${bytes} B）`);
  });

  test("まるごとバックアップ（local.json）と同じ大きさまで読める", () => {
    const backup = Number((backupSrc.match(/MAX_LS_VALUE = ([^,;]+)/) || [])[1].replace(/\s/g, "").split("*").reduce((a, b) => a * Number(b), 1));
    const importCap = Number(vm.runInNewContext(`(${coreSrc.match(/const PREFS_IMPORT_MAX = ([^;]+);/)[1]})`));
    assert.equal(importCap, backup, "読み込み上限＜バックアップの上限 だと、バックアップで入った設定が1本で読み直せない");
  });

  test("上限は読む前に見る（size → text の順）", () => {
    const at = coreSrc.indexOf("f.size > PREFS_IMPORT_MAX");
    assert.ok(at > 0 && at < coreSrc.indexOf("await file.text()", 0) + 1 || at < coreSrc.indexOf("file.text()"), "先に大きさを見る");
    assert.ok(coreSrc.includes("Number.isFinite(file.size)"), "size が読めない環境でも通さない");
    assert.ok(guardSrc.includes("PREFS_IMPORT_MAX = 20 * 1024 * 1024"), "検査も新しい目盛りを見ている");
  });
});

describe("pickImportedPrefs（壊れた項目だけ落として他は残す）", () => {
  const base = () => ({ uiScale: 100, notes: { a: 1 }, trkTabName: "trk-ost", specStyle: "spec0", uiMode: "auto", helper: null, list: [] });

  test("型が違うキーを弾いても、ほかのキーは通る", () => {
    const pickImportedPrefs = loadPicker();
    const r = pickImportedPrefs({ uiScale: "おおきめ", notes: { b: 2 }, uiMode: "wide" }, base(), () => true, []);
    assert.deepEqual(Object.keys(r.changes).sort(), ["notes", "uiMode"], "壊れた uiScale だけ落ちる");
    assert.deepEqual(J(r.rejected.map(x => `${x.k}:${x.why}`)), ["uiScale:type"]);
  });

  test("この設定に無いキーは unknown、列挙IDは enum（理由は分けて出す）", () => {
    const pickImportedPrefs = loadPicker();
    const r = pickImportedPrefs({ timeMachine: 42, specStyle: "spec999", trkTabName: "trk-ba" }, base(), (k, v) => v === "trk-ba", []);
    assert.deepEqual(J(r.changes), { trkTabName: "trk-ba" });
    assert.deepEqual(J(r.rejected.map(x => `${x.k}:${x.why}`).sort()), ["specStyle:enum", "timeMachine:unknown"]);
  });

  test("検査が例外を投げたキーはそのキーだけ落とす（全体を失敗にしない）", () => {
    const pickImportedPrefs = loadPicker();
    const r = pickImportedPrefs({ trkTabName: "trk-ba", uiScale: 125 }, base(), () => { throw new Error("検査が壊れた"); }, []);
    assert.deepEqual(J(r.changes), { uiScale: 125 }, "trkTabName だけが落ちる");
    assert.deepEqual(J(r.rejected.map(x => `${x.k}:${x.why}`)), ["trkTabName:enum"]);
  });

  test("原型を汚すキーは読まずに捨てる・手書きの項目は二重に当てない", () => {
    const pickImportedPrefs = loadPicker();
    const r = pickImportedPrefs({ "__proto__": { admin: true }, constructor: "x", notes: { z: 9 } }, base(), () => true, ["notes"]);
    assert.deepEqual(J(r.changes), {}, "notes は skip 側・__proto__ 系は読まない");
    assert.deepEqual(J(r.rejected), [], "弾いたことも報告しない（UNSAFE は無いものとして扱う）");
    assert.equal(({}).admin, undefined, "オブジェクトの原型が汚れていない");
  });

  test("null・配列・文字列の JSON でも落ちない", () => {
    const pickImportedPrefs = loadPicker();
    for (const bad of [null, undefined, 42, "[]", [], { helper: { deep: 1 } }]) {
      const r = pickImportedPrefs(bad, base(), () => true, []);
      assert.ok(r.changes && Array.isArray(r.rejected), `${JSON.stringify(bad)} で例外を出さない`);
    }
    const r = pickImportedPrefs({ helper: null, list: ["a"] }, base(), () => true, []);
    assert.deepEqual(J(r.changes), { helper: null, list: ["a"] }, "null と配列は形が合うものだけ通る");
  });
});

describe("読み込みの手続き（runPrefsImport）", () => {
  test("手書きの項目は1個ずつ試す（例外はその項目だけの不適用）", () => {
    const body = coreSrc.slice(coreSrc.indexOf("async function runPrefsImport("), coreSrc.indexOf("function runPrefsExport("));
    assert.ok(body.length > 500, "本体が切り出せる");
    assert.match(body, /const attempt = \(k, run\) =>/);
    for (const key of ["notes", "videoStyle", "bgDim", "bgBlur", "tvParamFavs", "trkRemoved", "trkListed", "tvDockSkin", "musicVolume", "typography", "trkFixedNotice", "language"]) {
      assert.ok(body.includes(`attempt("${key}"`), `${key} は attempt で包む`);
    }
    assert.ok(!/try\s*\{[\s\S]{0,60}\n\s*const txt = await file\.text\(\)/.test(body), "読み取り・解釈の失敗は別の言葉で返す");
    assert.ok(body.includes('setSt("prefImportTooBig"'), "上限超過は専用の言葉を返す（失敗-generic じゃない）");
    assert.ok(body.includes('setSt("prefImportNotObject"'), "JSON でないものはそう言う");
  });

  test("保存できなかったときは黙って再読み込みしない", () => {
    const body = coreSrc.slice(coreSrc.indexOf("async function runPrefsImport("), coreSrc.indexOf("function runPrefsExport("));
    assert.match(body, /if \(!saveUserPrefs\(\)\)/);
    assert.match(body, /setSt\("prefImportUnsaved"/);
    assert.match(body, /return \{ applied, rejected, saved: false \};/, "reload の前に戻る");
    assert.match(coreSrc, /function saveUserPrefs\(\{ fresh = false \} = \{\}\) \{[\s\S]*?return true;\s*\} catch \(_\) \{ return false; \}/, "saveUserPrefs が成否を返す");
  });

  test("書き出しは同じ payload を1回だけ作る（ sizes が実物とずれない）", () => {
    assert.match(coreSrc, /function prefsExportPayload\(kind\) \{/);
    assert.match(coreSrc, /function exportPrefs\(kind\) \{\s*\n\s*try \{ downloadJSON\(prefsExportPayload\(kind\)/);
    assert.match(coreSrc, /const payload = prefsExportPayload\(kind\);/, "報告用のバイト数は実物のから測る");
    assert.ok(!/else \{ \/\/ all[\s\S]{0,200}Object\.assign\(out, settings\)[\s\S]*?downloadJSON\(out/.test(coreSrc), "out を直接ダウンロードする旧の形に戻さない");
    assert.match(coreSrc, /delete out\.notes;/, "ノートをのぞく種別が実在する");
  });
});

describe("導線（⚙ → 💾 端末の保存）", () => {
  test("書き出し3本・読み込み1本・状態欄が 💾 に揃う", () => {
    for (const id of ["storageExportAllBtn", "storageExportCoreBtn", "storageExportNotesBtn", "storageImportFile", "storageTransferState"]) {
      assert.ok(html.includes(`id="${id}"`), `${id} がある`);
    }
    const storage = html.slice(html.indexOf('id="storagePanel"'), html.indexOf('id="mediaKeepPanel"'));
    assert.ok(storage.includes("storageExportAllBtn") && storage.includes("storageImportFile"), "💾 端末の保存の中に在る");
    assert.ok(storage.includes('data-i18n="storageTransferHint"'), "断り文（自動同期しない）が近い");
    assert.match(storage, /role="status"/, "結果は live な欄へ");
  });

  test("🛟 側の入口も生きたまま・互いの存在を伝え合う", () => {
    assert.ok(html.includes('id="emergencyImportFile"'), "緊急復旧からの読み込みは消さない");
    assert.ok(html.includes('data-i18n="emergencyTransferNote"'), "🛟 側に ⚙ の導線案内を1行");
    assert.match(coreSrc, /bind\("emergencyExportNotesBtn", \(\) => runPrefsExport\("notes", setSt\)\)/, "🛟 の書き出しも同じ手続き");
    assert.match(coreSrc, /bindPrefsImport\("emergencyImportFile", "emergencyStatus"\)|runPrefsImport\(f, setSt\)/);
    assert.match(coreSrc, /runPrefsImport\(f, status\)/, "💾 側も同じ手続き");
  });

  test("id は1どおり（同じ欄を2つ作って重複していない）", () => {
    const ids = html.match(/id="([a-zA-Z][\w-]*)"/g) || [];
    const seen = new Set(), dup = [];
    for (const raw of ids) { const id = raw.slice(4, -1); if (seen.has(id)) dup.push(id); seen.add(id); }
    assert.deepEqual(dup, [], `id が重複している: ${dup.join(", ")}`);
  });

  test("受け取るファイルは JSON だけ（ほかの入力と同じ口を流用しない）", () => {
    const at = html.indexOf('id="storageImportFile"');
    assert.ok(html.slice(at, at + 120).includes('accept="application/json,.json"'));
  });

  test("保存キーを増やしていない（設定の中に載せるだけ）", () => {
    assert.ok(!/trkPrefsTransfer|prefsTransferKey|storageTransferKey/.test(coreSrc), "新しい localStorage キーを作らない");
    const keys = coreSrc.match(/localStorage\.(setItem|getItem)\("([^"]+)"/g) || [];
    assert.ok(!keys.some(k => /Transfer/.test(k)));
  });

  test("4言語ぞろい・上限の数字を文面に直書きしない", () => {
    const keys = ["prefImportTooBig", "prefImportNotObject", "prefImportUnsaved", "prefExportedAll", "prefExportedCore",
      "prefExportedNotes", "storageTransferTitle", "storageTransferHint", "storageExportAllBtn", "storageExportCoreBtn",
      "storageExportNotesBtn", "storageImportBtn", "emergencyTransferNote"];
    for (const key of keys) assert.equal((i18nSrc.match(new RegExp(`\\b${key}:`, "g")) || []).length, 4, `${key} は4言語`);
    const tooBig = i18nSrc.match(/prefImportTooBig:"([^"]*)"/)[1];
    assert.ok(tooBig.includes("{mb}") && !/\b2 MiB\b/.test(tooBig), "上限は値で渡す（2 MiB を引き継がない）");
    assert.ok(i18nSrc.match(/storageTransferHint:"([^"]*)"/)[1].includes("自動"), "自動同期が無いことを日本語で言い切る");
  });

  test("cache 名を上げる（index.html・core.js・i18n を変えたので）", () => {
    assert.match(swSrc, /const CACHE = "trk-v2026\.11\.01-trk2(4[7-9]|\d\d)";/, "trk247 以降の版名なら可");
  });
});
