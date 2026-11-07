// SPDX-License-Identifier: GPL-3.0-or-later
/* trk300：作品ファイル（.stpack の拡張）の検証（段階2の項目4・E2）。
   見張ること：
   ・作品は「remodern の欄つき」の pack.json だけ。スキンのパックの読み込みでは入れない（番人）
   ・作品の値は許可リストで検証し、知らない項目（script・url など）は落とす
   ・ZIP の中身は pack.json と LICENSE・README の文書だけ（ほかは受け付けない）
   ・保存の一覧は 20 件まで。壊れた項目は捨て、保存した作品の ID は消さない範囲で残す */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const same = v => JSON.parse(JSON.stringify(v));

function load() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(read("js/remodern-regions.js"), ctx);
  vm.runInContext(read("js/remodern-work.js"), ctx);
  return ctx.TrkReModernWork;
}

const good = () => ({
  format: "shadow-taiko-pack", name: "Sample Work", author: "Someone", license: "OFL-1.1",
  remodern: { version: 1, id: "trk-re-modern-sample", regions: ["study", "base"],
    colors: { text: "#112233", ink: "#aabbcc" }, heading: { font: "dotgothic" } }
});

test("正しい作品は検証を通り、知らない項目は落ちる", () => {
  const W = load();
  const raw = good();
  raw.script = "alert(1)"; raw.remodern.url = "https://example.com"; raw.remodern.colors.evil = "javascript:1";
  const r = W.checkManifest(raw);
  assert.equal(r.ok, true);
  assert.deepEqual(same(r.work), {
    id: "trk-re-modern-sample", name: "Sample Work", author: "Someone", license: "OFL-1.1",
    regions: ["study", "base"], colors: { text: "#112233", ink: "#aabbcc" }, heading: { font: "dotgothic" }
  });
});

test("作品でないものは not-work（スキンのパックを作品と誤認しない）", () => {
  const W = load();
  assert.equal(W.checkManifest({ format: "shadow-taiko-pack", name: "x" }).reason, "not-work");
  assert.equal(W.checkManifest({ ...good(), format: "other" }).reason, "not-work");
  assert.equal(W.checkManifest(null).reason, "not-work");
  const v2 = good(); v2.remodern.version = 2;
  assert.equal(W.checkManifest(v2).reason, "not-work");
});

test("値が許可リストに合わないと、理由つきで拒否する", () => {
  const W = load();
  const cases = [
    [raw => { raw.remodern.id = "../evil"; }, "bad-id"],
    [raw => { raw.remodern.regions = ["common", "elsewhere"]; }, "unknown-region"],
    [raw => { raw.remodern.colors.ink = "red"; }, "bad-color"],
    [raw => { raw.remodern.heading.font = "http://x"; }, "bad-heading-font"],
    [raw => { raw.license = ""; }, "no-license"],
    [raw => { raw.name = "  "; }, "no-name"],
  ];
  for (const [mutate, reason] of cases) {
    const raw = good(); mutate(raw);
    assert.equal(W.checkManifest(raw).reason, reason, reason);
  }
});

test("ZIP の中身：pack.json と文書だけ。別のファイル・入れ子は拒否", () => {
  const W = load();
  assert.equal(W.checkEntryNames(["pack.json", "LICENSE.txt", "README.md", "__MACOSX/._pack.json"]).ok, true);
  assert.equal(W.checkEntryNames(["pack.json", "index.js"]).reason, "extra-file");
  assert.equal(W.checkEntryNames(["pack.json", "sub/a.png"]).reason, "nested-file");
  assert.equal(W.checkEntryNames(["pack.json", "style.css"]).reason, "extra-file");
  /* 文書だけを許す（拡張子が .txt／.md の LICENSE・README のみ。実行できる名前は通さない） */
  for (const bad of ["README.js", "LICENSE.woff2", "README.html", "LICENSE-OFL.txt", "README.md.js", "README.txt.exe"]) {
    assert.equal(W.checkEntryNames(["pack.json", bad]).ok, false, bad);
  }
  assert.equal(W.checkEntryNames(["pack.json", "readme.txt"]).ok, true);
});

test("保存の一覧：壊れた項目は捨て、同じ ID は置き換え、20 件で止める", () => {
  const W = load();
  const ok = W.checkManifest(good()).work;
  const loaded = W.loadWorks([ok, { id: "bad" }, null, "x"]);
  assert.deepEqual(Object.keys(loaded), ["trk-re-modern-sample"]);
  const again = W.addWork([ok], { ...ok, name: "Renamed" });
  assert.equal(again.length, 1);
  assert.equal(again[0].name, "Renamed");
  const full = Array.from({ length: 20 }, (_, i) => ({ id: `trk-re-modern-w${i}` }));
  assert.equal(W.addWork(full, ok), null, "21 件目は入れない");
  assert.equal(Object.keys(W.loadWorks(Array.from({ length: 30 }, () => ok))).length, 1, "同じ ID は 1 件");
});

test("配線：番人・保存の欄・読み込み口・文言 4 言語", () => {
  const custom = read("js/custom.js");
  assert.ok(custom.includes('if (raw && typeof raw === "object" && raw.remodern) throw new PackError("packIsRemodernWork");'));
  const html = read("index.html");
  assert.ok(html.indexOf('src="js/remodern-work.js"') > 0 && html.indexOf('src="js/remodern-work.js"') < html.indexOf('src="js/remodern-ui.js"'));
  assert.ok(html.includes('id="remodernWorkFile"') && html.includes('accept=".stpack,.zip"'));
  assert.ok(read("js/core.js").includes("remodernWorks: Array.isArray(prefs.remodernWorks)"));
  const i18n = read("js/i18n.js");
  for (const k of ["remodernWorkHint", "remodernWorkBtn", "remodernWorkClear", "remodernWorkOk", "remodernWorkBad",
    "remodernWorkTooBig", "remodernWorkFull", "remodernWorkClearDone", "packIsRemodernWork"]) {
    assert.equal(i18n.split(`${k}:`).length - 1, 4, `${k} は 4 言語に 1 つずつ`);
  }
});
