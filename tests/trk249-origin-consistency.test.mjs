// SPDX-License-Identifier: GPL-3.0-or-later
/* trk249: オリジン（配布URL）の記述を**互いにそろえたまま**にする検査

   リポジトリを組織へ移すと Pages の URL が変わる（`https://trk-nexus.github.io/trk-PWA/` など）。
   そのとき **1か所だけ**更新して他を古いままにする事故が起きやすい（`og:url` だけ新しい、README は古い、等）。
   そこで「URLの値」を固定せず、**同じ値を指しているか**だけを見る検査にしてあります。
   ＝移籍前も、4か所を同時に書き換えた後も、どちらも緑になる。

   合わせて、オリジンを直書きしてよい場所を縛る（`js/`・`css/`・`sw.js`・`manifest.webmanifest` は
   すべて相対。ここに絶対URLが増える＝オフラインで壊れる・移籍で追従できなくなる）。 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const indexHtml = read("index.html");
const readme = read("README.md");
const originDoc = read("docs/ORIGIN.md");
const manifest = read("manifest.webmanifest");
const sw = read("sw.js");

/** index.html の og:url（1本だけ在る） */
function pageUrl() {
  const m = indexHtml.match(/<meta property="og:url" content="([^"]+)">/);
  assert.ok(m, "og:url が1本在る");
  return m[1];
}
describe("同じURLを指しているか（値は固定しない）", () => {
  test("og:url は1本だけ（作り直して2本並んでいない）", () => {
    assert.equal((indexHtml.match(/property="og:url"/g) || []).length, 1);
    assert.match(pageUrl(), /^https:\/\/[^/]+\/trk-PWA\/$/, "Pages のプロジェクトサイトURL（末尾スラッシュ付き）");
  });

  test("README の「▶ 遊ぶ／▶ Play」が og:url と同じURL", () => {
    const url = pageUrl();
    const links = [...readme.matchAll(/▶ \*\*[^*]*\*\* *(https:\/\/\S+)/g)].map(m => m[1].replace(/[)>\]]+$/, ""));
    assert.ok(links.length >= 2, `日本語と英語の両方にリンクがある（実測 ${links.length} 本）`);
    for (const l of links) assert.equal(l, url, "README の Play リンクは og:url と一致");
    /* badge は `[![Play]( shields の画像URL )]( 飛び先 )]` の形なので、飛び先は2番目 */
    const badge = readme.match(/\[!\[Play\]\([^)]*\)\]\((https:\/\/[^)]+)\)/);
    assert.ok(badge, "README の badge がある");
    assert.equal(badge[1], url, "badge の飛び先も同じ");
  });

  test("og:image も同じ origin / 配下（画像だけが古いドメインに取りにいかない）", () => {
    const m = indexHtml.match(/<meta property="og:image" content="([^"]+)">/);
    assert.ok(m, "og:image がある");
    assert.ok(m[1].startsWith(pageUrl()), `og:image（${m[1]}）は og:url（${pageUrl()}）の下に在る`);
    const imgRel = m[1].slice(pageUrl().length);
    assert.ok(fs.existsSync(path.join(ROOT, imgRel)), `実ファイルが在る（${imgRel}）`);
  });

  test("docs/ORIGIN.md が現在のオリジンを挙げている（決まった場所と実物がずれていない）", () => {
    const origin = new URL(pageUrl()).origin;
    assert.ok(originDoc.includes(origin.replace(/^https:\/\//, "")), `ORIGIN.md に ${origin} の記述が在る`);
  });
});

describe("オリジンを直書きしてよい場所", () => {
  test("コード・style・SW・manifest に「このアプリ自身のオリジン」を書き込まない", () => {
    /* js/ の中に https: が在ること自体は許す（共有リンクの検査や、アドオン見本など）。
       禁止するのは **Pages のオリジン／github.io／CDN** をコード側に埋め込むこと。
       埋めると、移籍でURLが変わったときにコードを壊す・オフラインで外部へ取りに行く。 */
    const origin = new URL(pageUrl()).origin;
    const banned = [origin.replace(/^https?:\/\//, ""), "github.io", "githubusercontent.com", "unpkg.com", "jsdelivr.net", "cdn."];
    const files = ["sw.js", "manifest.webmanifest"];
    const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
    for (const dir of ["js", "css"]) files.push(...walk(dir));
    for (const rel of files) {
      const body = read(rel);
      const hits = banned.filter(b => body.includes(b));
      assert.deepEqual(hits, [], `${rel} にオリジン・github.io・CDN を書き込まない（検出：${hits.join(", ")}）`);
    }
  });

  test("manifest は相対（start_url・scope・id）＝移籍でマニフェストを書き換えないで済む", () => {
    const m = JSON.parse(manifest);
    for (const key of ["start_url", "scope", "id"]) {
      assert.ok(m[key] && m[key].startsWith("./"), `${key} は ${JSON.stringify(m[key])} のように相対`);
    }
    for (const icon of m.icons || []) assert.ok(icon.src.startsWith("./") || !/^https?:/.test(icon.src), "アイコンも相対");
  });

  test("HTML は index.html の og タグだけがオリジンを持つ（ほかの入口に漏れていない）", () => {
    const htmls = ["index.html", "privacy.html", "credits.html", "tools/ios-probe.html"].filter(f => fs.existsSync(path.join(ROOT, f)));
    for (const rel of htmls) {
      const hits = (read(rel).match(/https?:\/\/[a-z0-9.-]+\.github\.io/gi) || []);
      if (rel === "index.html") assert.deepEqual([...new Set(hits)].map(u => new URL(u).origin), [new URL(pageUrl()).origin], "og タグは現物オリジン1本");
      else assert.deepEqual(hits, [], `${rel} に github.io を書かない`);
    }
  });

  test("cache 名はこの版のもので、shell（index.html）を確実に拾っている", () => {
    const cache = sw.match(/const CACHE = "([^"]+)"/);
    assert.ok(cache && /^trk-v\d{4}\.\d{2}\.\d{2}-trk\d+$/.test(cache[1]), `cache 名は ${cache && cache[1]}`);
    assert.match(sw, /"\.\/index\.html"|["']index\.html["']/, "index.html を precache している（オフライン初回に効く）");
  });
});
