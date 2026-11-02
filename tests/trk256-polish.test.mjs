// SPDX-License-Identifier: GPL-3.0-or-later
/* 🧹 trk256：小粒のセット A（S2〜S6）。
 *
 *   ・S2 オフラインでも注意書き（privacy）・クレジット・追加機能の説明（docs/ADDONS.md）を開ける
 *   ・S3 JavaScript が止まっているときに、真っ暗ではなく理由を1枚出す（<noscript>）
 *   ・S4 README のローカル起動手順が、このリポジトリ（trk-PWA）を指している
 *   ・S5 HANDOFF §1.5 の「いまの状態」が、いまの数字になっている
 *   ・S6 「13行」の食い違いを直し、HANDOFF §1.5 の cache 名が sw.js とずれたら気づく（check-repo）
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const swSrc = read("sw.js");
const html = read("index.html");
const readme = read("README.md");
const handoff = read("docs/HANDOFF.md");
const typoSrc = read("js/typography.js");
const repoCheck = read("tools/check-repo.mjs");

function extractFn(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${marker} がある`);
  const end = source.indexOf("\n}", start);
  assert.notEqual(end, -1, `${marker} の閉じかっこがある`);
  return source.slice(start, end + 2);
}

describe("trk256 S2 オフラインでも書類を開ける", () => {
  test("注意書き・クレジット・追加機能の説明を先読みに足している", () => {
    assert.match(swSrc, /const PRECACHE_EXTRA = \[[^\]]*"credits\.html"[^\]]*\]/s);
    assert.match(swSrc, /const PRECACHE_EXTRA = \[[^\]]*"privacy\.html"[^\]]*\]/s);
    assert.match(swSrc, /const PRECACHE_EXTRA = \[[^\]]*"docs\/ADDONS\.md"[^\]]*\]/s);
  });

  test("docs/ は丸ごと入れず、書いた1本だけを例外にする", () => {
    assert.match(swSrc, /const PRECACHE_ALLOW = \["docs\/ADDONS\.md"\];/);
    const api = vm.createContext({});
    const code = [
      'const SCOPE = { pathname: "/trk-PWA/" };',
      'const PRECACHE_SKIP = ["assets/vendor/", "assets/optional-demo-audio/", "docs/", "tools/"];',
      swSrc.match(/const PRECACHE_ALLOW = .*;/)[0],
      extractFn(swSrc, "function precacheWanted(url)"),
      "this.api = { precacheWanted };"
    ].join("\n");
    vm.runInContext(code, api);
    const ok = p => api.api.precacheWanted({ pathname: "/trk-PWA/" + p });
    assert.equal(ok("docs/ADDONS.md"), true, "ADDONS は入れる");
    assert.equal(ok("docs/HANDOFF.md"), false, "ほかの docs は入れない");
    assert.equal(ok("credits.html"), true);
    assert.equal(ok("privacy.html"), true);
    assert.equal(ok("js/core.js"), true);
    assert.equal(ok("assets/vendor/three@0.180.0/build/three.module.js"), false);
  });

  test("オフラインのナビゲーションは、キャッシュにある書類をそのまま返す", () => {
    assert.match(swSrc, /const cached = await matchOwned\(request, pinned\);/);
    assert.match(swSrc, /if \(cached && \(!pinned \|\| await pinnedMatches\(cached, pinned\)\)\) return cached;/);
  });
});

describe("trk256 S3 JavaScript が止まっているときの案内", () => {
  test("<noscript> が body の先頭近くにあり、理由を書いている", () => {
    const body = html.indexOf("<body>");
    const noscript = html.indexOf("<noscript>");
    assert.ok(body > 0 && noscript > body, "<body> のあとにある");
    const block = html.slice(noscript, html.indexOf("</noscript>", noscript));
    assert.match(block, /JavaScript が必要です/);
    assert.match(block, /needs JavaScript/);
    assert.ok(block.length < 1200, "1枚だけ（大きすぎない）");
  });

  test("案内の中でスクリプトを動かさない（止まっている前提）", () => {
    const block = html.slice(html.indexOf("<noscript>"), html.indexOf("</noscript>"));
    assert.ok(!/<script/i.test(block));
  });
});

/* 🔁 trk257：鏡（`make-stable`）を当てた上流では、README の `trk-PWA` が `trk` に反転します。
   名前を直に書くと**鏡の側だけ赤くなる**（実際に /tmp の鏡で 1 件落ちました）ので、
   **この作業ツリーの origin** から名前を決めます。git が無い所では「clone 先と cd が同じ」だけを見ます。 */
function ownRepoName() {
  try {
    const url = execFileSync("git", ["remote", "get-url", "origin"], {
      cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const name = url.replace(/\.git$/, "").split(/[\/:]/).pop();
    return /^(trk|trk-PWA)$/.test(name) ? name : "";
  } catch (_) { return ""; }
}

describe("trk256 S4 README のローカル起動手順", () => {
  test("このリポジトリ（origin の名前）を clone する", () => {
    const hit = readme.match(/git clone https:\/\/github\.com\/Trk-Nexus\/([\w.-]+)\.git/);
    assert.ok(hit, "clone の行がある");
    assert.match(readme, new RegExp(`cd ${hit[1].replace(/\./g, "\\.")}`), "cd が clone 先と同じ名前");
    const own = ownRepoName();
    if (own) assert.equal(hit[1], own, `clone 先は origin（${own}）と同じ`);
    else assert.ok(/^(trk|trk-PWA)$/.test(hit[1]), `clone 先が ${hit[1]}`);
  });

  test("開発版と安定版の違いを1行で書いている", () => {
    assert.match(readme, /開発版/);
    assert.match(readme, /Trk-Nexus\/trk\)/);
  });
});

describe("trk256 S5・S6 HANDOFF §1.5 と sw.js のずれ", () => {
  const section = (() => {
    const from = handoff.indexOf("## 1.5 ");
    const to = handoff.indexOf("\n## 2. ", from);
    return from >= 0 ? handoff.slice(from, to > from ? to : undefined) : "";
  })();

  test("§1.5 が、いまのテスト数と cache 名を書いている", () => {
    assert.ok(section.length > 0);
    assert.match(section, /1313 pass|1[3-9]\d\d pass/, "いまの件数（1,300 台）");
    const cache = swSrc.match(/const CACHE = "([^"]+)";/)[1];
    assert.ok(section.includes(cache), `§1.5 に ${cache} がある`);
  });

  test("§1.5 に古い「trk-Standalone は空」の記述を残さない", () => {
    assert.ok(!section.includes("trk-Standalone` はまだ空"));
  });

  test("check-repo が §1.5 の cache 名と sw.js のずれを見る", () => {
    assert.match(repoCheck, /docs\/HANDOFF\.md §1\.5 cache is/);
    assert.match(repoCheck, /§1\.5 does not name the current service-worker cache/);
  });

  test("typography.js の「13行」を直している", () => {
    assert.ok(!typoSrc.includes("上の13行"));
    assert.match(typoSrc, /PAIRINGS`（14組）/);
  });
});

describe("trk256 M1 Actions を commit SHA に固定", () => {
  const workflows = [".github/workflows/check.yml", ".github/workflows/pages.yml"].map(read);

  test("`uses:` は 40 桁の SHA＋版のコメント（タグを書かない）", () => {
    const lines = workflows.flatMap(text => text.split("\n")).filter(line => /^\s*uses:\s*\S+/.test(line));
    assert.ok(lines.length >= 6, `uses: が ${lines.length} 本`);
    for (const line of lines) {
      assert.match(line.trim(), /^uses:\s+[\w.-]+\/[\w.-]+@[0-9a-f]{40}(\s+#\s+v[\d.]+)?$/, line.trim());
    }
  });

  test("check-repo が見張っている（タグに戻したら落ちる）", () => {
    assert.match(repoCheck, /has an unpinned action/);
  });
});

describe("trk256 M2 mobile-web に開発文書を入れない", () => {
  const mobile = read("tools/prepare-mobile-web.mjs");

  test("docs を丸ごと写さず、guide と ADDONS だけにする", () => {
    assert.ok(!/const directories = \[[^\]]*"docs"/s.test(mobile), "directories に docs を入れない");
    assert.match(mobile, /const docsFiles = \["docs\/ADDONS\.md"\];/);
    assert.match(mobile, /const docsDirectories = \["docs\/guide"\];/);
    assert.match(mobile, /for \(const rel of \[\.\.\.docsFiles, \.\.\.docsDirectories\]\)/);
  });

  test("写す先の形（ディレクトリとファイル）を分けて扱う", () => {
    assert.match(mobile, /if \(fs\.statSync\(source\)\.isDirectory\(\)\) fs\.cpSync\(source, destination, \{ recursive: true \}\);/);
    assert.match(mobile, /else fs\.copyFileSync\(source, destination\);/);
  });

  test("check-repo が見張っている（docs を丸ごと写したら落ちる）", () => {
    assert.match(repoCheck, /copies the whole docs\/ directory/);
  });
});
