// SPDX-License-Identifier: GPL-3.0-or-later
/* 🧙 スキン目録の読み口（trk271）
 *
 * Skin 側（trk-Avatar-Library）から届く「目録」は、回によって形が違います。
 *   ① `catalog/skins.json`          … { "format": …, "skins": [ … ] }
 *   ② スキン 1 枚の JSON            … { "id": …, "cat": […], "colors": { … } }
 *   ③ ジェネレーターの出力（.js）   … `const SKINS_WIZARD = [ … ]`（配列）
 *
 * どれでも同じ「スキンの配列」にして返します。**外へは取りに行きません**（読むのは渡されたファイルだけ）。
 * .js は vm の中で評価します（require・fetch・ネットワークは渡しません＝データとして読むだけ）。
 */
import fs from "node:fs";
import vm from "node:vm";

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

/* .js の出力を配列にする。読めないときは理由付きで null */
export function catalogFromJs(text) {
  /* ESM の書き出し（`export { X };` など）は、vm では評価できないので落として読む */
  const src = String(text)
    .replace(/^[ \t]*export\s*\{[^}]*\}[ \t]*;?[ \t]*$/gm, "")
    .replace(/^[ \t]*export\s+default\s+/gm, "module.exports.default = ")
    .replace(/^[ \t]*export\s+(const|let|var|function|class)\s/gm, "$1 ");
  const sandbox = { console: { log() {}, warn() {}, error() {} }, module: { exports: {} }, exports: {}, Math, JSON, Object, Array, String, Number, Boolean };
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  const probe = `
    ;globalThis.__trkSkins = (() => {
      const cands = [];
      try { if (typeof SKINS_WIZARD !== "undefined") cands.push(SKINS_WIZARD); } catch (_) {}
      try { if (typeof SKINS !== "undefined") cands.push(SKINS); } catch (_) {}
      try { if (typeof module !== "undefined" && module.exports) cands.push(module.exports.default || module.exports); } catch (_) {}
      for (const c of cands) {
        if (Array.isArray(c)) return c;
        if (c && Array.isArray(c.skins)) return c.skins;
        if (c && c.default && Array.isArray(c.default)) return c.default;
      }
      return null;
    })();`;
  try { vm.runInContext(src + probe, sandbox, { timeout: 2000, filename: "catalog.js" }); }
  catch (e) { return { error: String(e && e.message || e) }; }
  const list = sandbox.__trkSkins;
  if (!Array.isArray(list) || !list.length) return { error: "配列（SKINS_WIZARD など）が見つかりません" };
  return { list, shape: "js" };
}

/* ファイルを読んで { list, shape } を返す。読めなければ { error } */
export function loadCatalogFile(file) {
  let text;
  try { text = fs.readFileSync(file, "utf8"); }
  catch (e) { return { error: "読めませんでした：" + (e && e.message ? e.message : String(e)) }; }
  const looksJs = /\.(m?js|cjs)$/i.test(file) || /^\s*(?:\/\/|import |export |const |let |var |module\.exports)/m.test(text.slice(0, 400));
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
