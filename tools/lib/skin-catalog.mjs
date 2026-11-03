// SPDX-License-Identifier: GPL-3.0-or-later
/* 🧙 スキン目録の読み口（trk271 → trk273）
 *
 * Skin 側（trk-Avatar-Library）から届く「目録」は、回によって形が違います。
 *   ① `catalog/skins.json`          … { "format": …, "skins": [ … ] }
 *   ② スキン 1 枚の JSON            … { "id": …, "cat": […], "colors": { … } }
 *   ③ パックの JSON                 … { "skin": { … } }
 *   ④ 生成物の `.js`                 … `const SKINS_WIZARD = [ … ]` / `S["id"] = { … }` / ESM の export
 *
 * どれでも同じ「スキンの配列」にして返します。**外へは取りに行きません**。
 *
 * ⚠ trk273：`.js` は**もう評価しません**（trk271 は node:vm で走らせていた）。
 *   node:vm は「安全のための仕組み」ではなく、`Object.constructor("return process")()` のように
 *   ホストの関数へ抜けられます（レビュー M2 で実演つきの指摘）。
 *   いまは `.js` を**文字として読み**、配列・オブジェクトの**リテラルだけ**を切り出して JSON に直し、
 *   `JSON.parse` します。つまり `.js` の中の式・関数・呼び出しは**一切動きません**。
 *   読めない書き方（変数・関数呼び出し・テンプレート文字列など）は、理由を返して断ります。
 */
import fs from "node:fs";

export const FORMAT = "trk-avatar-library-skins";

/* JSON の形をそろえる。読めない形なら null */
export function catalogFromJson(doc) {
  if (Array.isArray(doc)) return { list: doc, shape: "array" };
  if (!doc || typeof doc !== "object") return null;
  if (Array.isArray(doc.skins)) return { list: doc.skins, shape: "catalog" };
  if (doc.skin && typeof doc.skin === "object") return { list: [doc.skin], shape: "pack" };
  if (doc.colors && typeof doc.colors === "object") return { list: [doc], shape: "skin" };
  return null;
}

/* ==================== 文字として読む小さなパーサ ==================== */

const ID_START = /[A-Za-z_$]/;
const ID_CHAR = /[A-Za-z0-9_$]/;

function fail(msg) { const e = new Error(msg); e.trkParse = true; throw e; }

/* 空白とコメント（// と /* *\/）を飛ばす */
function skipTrivia(text, i) {
  for (;;) {
    while (i < text.length && /\s/.test(text[i])) i++;
    if (text[i] === "/" && text[i + 1] === "/") {
      const nl = text.indexOf("\n", i);
      i = nl < 0 ? text.length : nl + 1;
      continue;
    }
    if (text[i] === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      if (end < 0) fail("コメントが閉じていません");
      i = end + 2;
      continue;
    }
    return i;
  }
}

/* 文字列を JSON の文字列にする（'…' と "…" の両方・JS の余計なエスケープを落とす） */
function readString(text, i) {
  const quote = text[i];
  let out = '"';
  i++;
  while (i < text.length) {
    const c = text[i];
    if (c === "\\") {
      const n = text[i + 1];
      if (n === undefined) fail("文字列が閉じていません");
      if (n === "\\" || n === "/" || n === '"' || n === "b" || n === "f" || n === "n" || n === "r" || n === "t") { out += "\\" + n; i += 2; continue; }
      if (n === "u") { out += "\\u" + text.slice(i + 2, i + 6); i += 6; continue; }
      if (n === "'") { out += "'"; i += 2; continue; }          /* \' は JSON では素の ' */
      if (n === "\n") { i += 2; continue; }                      /* 行継続 */
      out += n; i += 2; continue;                                /* その他の \x は素の文字に */
    }
    if (c === quote) { out += '"'; return { json: out, next: i + 1 }; }
    if (c === "\\") { out += "\\"; i++; continue; }
    if (c === '"') { out += '\\"'; i++; continue; }              /* '…' の中の " */
    if (c === "\n") fail("文字列が閉じていません");
    out += c;
    i++;
  }
  fail("文字列が閉じていません");
}

/* リテラル（配列・オブジェクト・数・文字列・真偽・null）を JSON にして返す */
function readValue(text, i) {
  i = skipTrivia(text, i);
  const c = text[i];
  if (c === undefined) fail("値がありません");
  if (c === "[" || c === "{") {
    const open = c, close = c === "[" ? "]" : "}";
    let out = open;
    i++;
    for (;;) {
      i = skipTrivia(text, i);
      if (text[i] === undefined) fail(`${close} が閉じていません`);
      if (text[i] === close) { out = out.replace(/,$/, "") + close; return { json: out, next: i + 1 }; }
      /* 項目 */
      i = skipTrivia(text, i);
      if (open === "{") {
        /* 鍵：識別子か文字列 */
        let key;
        if (text[i] === '"' || text[i] === "'") {
          const s = readString(text, i);
          key = s.json;
          i = s.next;
        } else if (ID_START.test(text[i])) {
          let id = "";
          while (i < text.length && ID_CHAR.test(text[i])) id += text[i++];
          key = JSON.stringify(id);
        } else {
          fail(`オブジェクトの鍵として読めない形です（${JSON.stringify(text.slice(i, i + 20))}）`);
        }
        i = skipTrivia(text, i);
        if (text[i] !== ":") fail("鍵のあとに `:` がありません");
        i++;
        out += (out.endsWith("{") || out.endsWith(",") ? "" : ",") + key + ":";
      } else if (out.endsWith(",") || out.endsWith("[")) {
        out += "";
      }
      const v = readValue(text, i);
      out += v.json;
      i = skipTrivia(text, v.next);
      if (text[i] === ",") { out += ","; i++; continue; }
      if (text[i] === close) { out = out.replace(/,$/, "") + close; return { json: out, next: i + 1 }; }
      fail(`${close} の前に読めない形があります（${JSON.stringify(text.slice(i, i + 20))}）`);
    }
  }
  if (c === '"' || c === "'") return readString(text, i);
  if (c === "`") fail("テンプレート文字列（`…`）は受け取れません。JSON で渡してください");
  if (c === "-" || /[0-9]/.test(c)) {
    const m = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i));
    if (!m) fail("数として読めません");
    return { json: m[0], next: i + m[0].length };
  }
  if (ID_START.test(c)) {
    let id = "";
    while (i < text.length && ID_CHAR.test(text[i])) id += text[i++];
    if (id === "true" || id === "false" || id === "null") return { json: id, next: i };
    fail(`値として読めない名前です（${id}）。式・関数・変数は受け取れません`);
  }
  fail(`読めない文字です（${JSON.stringify(text[i])}）`);
}

/* リテラルの範囲を切り出して JSON.parse（= 評価しない） */
function parseLiteralAt(text, i) {
  const v = readValue(text, i);
  let parsed;
  try { parsed = JSON.parse(v.json); }
  catch (e) { fail("JSON として読めません（" + (e && e.message) + "）"); }
  return { value: parsed, next: v.next };
}

/* `= [` の直後の配列を探す（`const X = [...]`・`export default [...]`・`module.exports = [...]`） */
function findArrayLiteral(text) {
  const trivia = skipTrivia(text, 0);
  if (text[trivia] === "[") {
    try {
      const got = parseLiteralAt(text, trivia);
      if (Array.isArray(got.value)) return { list: got.value };
    } catch (_) { /* 下の走査へ */ }
  }
  const re = /=\s*\[/g;
  let m;
  while ((m = re.exec(text))) {
    const at = m.index + m[0].length - 1;
    /* `[` の直前が `=` であること（比較の == などは除く） */
    const before = text.slice(Math.max(0, m.index - 2), m.index + 1);
    if (/==/.test(before)) continue;
    try {
      const got = parseLiteralAt(text, at);
      if (Array.isArray(got.value)) return { list: got.value };
    } catch (_) { /* 次の候補へ */ }
  }
  return null;
}

/* `S["id"] = { … }` のような代入を拾う（このアプリの生成物の形） */
function findObjectAssignments(text) {
  const re = /[A-Za-z_$][\w$]*\s*\[\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\s*\]\s*=\s*\{/g;
  const list = [];
  let m;
  while ((m = re.exec(text))) {
    const braceAt = m.index + m[0].length - 1;
    try {
      const key = JSON.parse(readString(m[1], 0).json);
      const got = parseLiteralAt(text, braceAt);
      const value = got && got.value;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        /* 鍵が id（生成物は `S["id"] = { … }` の形で id を持たない） */
        list.push(value.id ? value : { id: key, ...value });
      }
    } catch (_) { /* 読めない 1 件は飛ばす（数で判断する） */ }
  }
  return list.length ? list : null;
}

/* .js を「文字として」読んでスキンの配列にする。動かさない */
export function catalogFromJs(text) {
  const src = String(text);
  const arr = findArrayLiteral(src);
  if (arr) return { list: arr.list, shape: "js" };
  const objs = findObjectAssignments(src);
  if (objs) return { list: objs, shape: "js" };
  return { error: "配列（`const SKINS_WIZARD = [ … ]`）も `S[\"id\"] = { … }` も見つかりません。JSON で渡してください" };
}

/* ファイルを読んで { list, shape } を返す。読めなければ { error } */
export function loadCatalogFile(file) {
  let text;
  try { text = fs.readFileSync(file, "utf8"); }
  catch (e) { return { error: "読めませんでした：" + (e && e.message ? e.message : String(e)) }; }
  const looksJs = /\.(m?js|cjs)$/i.test(file) || /^\s*(?:\/\/|\/\*|import |export |const |let |var |module\.exports|\()/m.test(text.slice(0, 400));
  /* 見分けは「拡張子」ではなく「中身」を優先する。読み損ねたら、もう一方でもう一度だけ試す */
  const order = looksJs ? ["js", "json"] : ["json", "js"];
  let firstError = null;
  let parsedButWrongShape = false;
  for (const kind of order) {
    if (kind === "js") {
      const js = catalogFromJs(text);
      if (!js.error) return js;
      firstError = firstError || js.error;
    } else {
      let doc;
      try { doc = JSON.parse(text); }
      catch (e) { firstError = firstError || (e && e.message ? e.message : String(e)); continue; }
      const got = catalogFromJson(doc);
      if (got) return got;
      parsedButWrongShape = true;
      firstError = firstError || "形が違います";
    }
  }
  if (parsedButWrongShape) return { error: "形が違います（skins の配列・スキン 1 枚・SKINS_WIZARD のどれかでください）" };
  return { error: "読めませんでした：" + (firstError || "目録として読めません") };
}
