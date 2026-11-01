// SPDX-License-Identifier: GPL-3.0-or-later
/* 🧭 trk240：役割の書面と、`tools/check-set.mjs` の「契約」
 *
 *   背景（2026-11-01・倉庫の返事8）：
 *     ミュージアム（trk-Avatar-Library）の CI が、**こちらの `tools/check-set.mjs` をそのまま呼ぶ**
 *     ようになりました。ということは、**呼び方・終了コード・--json の意味・--have の形**が
 *     相手との契約になります。黙って変えると、相手の CI が理由も分からず赤くなります。
 *
 *   ここで確かめること：
 *     ① 3 つの終了コード（0＝入れられる／1＝食い違い／2＝開けない）が実際にそうなる
 *     ② --json が 1 行の JSON で、人が読む文と同じ数字を返す（機械が読める）
 *     ③ 書面（docs/ROLES-TRK240-2026-11-01.md）に、固定した 4 つと両側の分担が書いてある
 *     ④ アプリの殻（index.html・js/）は変えていない＝sw.js の cache は trk239 のまま
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const zipSrc = read("js/zip-io.js");
const toolSrc = read("tools/check-set.mjs");
const roles = read("docs/ROLES-TRK240-2026-11-01.md");
const letter = read("docs/LETTER-TRK240-REPLY-2026-11-01.md");
const handoff = read("docs/HANDOFF.md");
const sw = read("sw.js");

/* ZIP を組むためだけに zip-io を読む（アプリ本体は道具が自分で読む） */
function loadZipIO() {
  const sandbox = {
    window: {}, console, Promise, JSON, Math, Number, String, Object, Array, Set, Map, Error,
    Blob, File, Uint8Array, DataView, ArrayBuffer, BigInt, Uint32Array, TextEncoder, TextDecoder, Response,
    CompressionStream, DecompressionStream, Date,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(zipSrc, sandbox, { filename: "js/zip-io.js" });
  return sandbox.window.Trk.zipIO;
}
const Z = loadZipIO();

const pack = (id, size, over = {}) => ({
  id, name: id, author: "trk", version: "1.0.0", file: `font-packs/${id}.stpack`,
  sha256: "0".repeat(64), bytes: size, fonts: [], ...over,
});

/* セットを組む（目録・パック・set.json）。over で目録だけ書き換えられる */
async function makeSet(tmp, { packs = [pack("a", 10), pack("b", 20)], catalog = null, name = "set.stlib" } = {}) {
  const entries = [{ name: "catalog/index.json", blob: new Blob([JSON.stringify({ format: "trk-avatar-library", version: 1, name: "目録", packs: catalog || packs })]) }];
  for (const p of packs) entries.push({ name: p.file, blob: new Blob(["x".repeat(p.bytes)]) });
  entries.push({ name: "set.json", blob: new Blob([JSON.stringify({ format: "trk-set", version: 1, name: "テスト", release: "r6" })]) });
  const file = path.join(tmp, name);
  fs.writeFileSync(file, Buffer.from(await (await Z.zipWrite(entries)).arrayBuffer()));
  return file;
}

/* 道具を実際に走らせる（終了コードと出力を取る） */
function run(args) {
  try {
    const out = execFileSync(process.execPath, [path.join(ROOT, "tools/check-set.mjs"), ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: String(e.stdout || ""), err: String(e.stderr || "") };
  }
}

describe("trk240 tools/check-set.mjs の契約（倉庫の CI が呼ぶ）", () => {
  test("① 0＝そのまま入れられる／1＝食い違い／2＝開けない", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "trk240-"));
    try {
      /* 中身と一致（sha256 は目録と違うが、--hash を付けなければ大きさだけで OK） */
      const good = await makeSet(tmp, { name: "good.stlib" });
      assert.equal(run([good]).code, 0);

      /* 目録の大きさを書き換える＝食い違い */
      const bad = await makeSet(tmp, { name: "bad.stlib", catalog: [pack("a", 999), pack("b", 20)] });
      assert.equal(run([bad]).code, 1);

      /* 目録に無いパック＝入っていない（これも 1） */
      const miss = await makeSet(tmp, { name: "miss.stlib", catalog: [pack("a", 10), pack("b", 20), pack("ghost", 5)] });
      assert.equal(run([miss]).code, 1);

      /* ZIP でない・ファイルが無い＝開けない（2） */
      const notZip = path.join(tmp, "x.stlib");
      fs.writeFileSync(notZip, "hello");
      assert.equal(run([notZip]).code, 2);
      assert.equal(run([path.join(tmp, "nope.stlib")]).code, 2);
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test("② --json は 1 行の JSON で、人が読む文と同じ数字を返す", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "trk240-"));
    try {
      const set = await makeSet(tmp, { name: "ok.stlib" });
      const have = path.join(tmp, "have.json");
      fs.writeFileSync(have, JSON.stringify({ packs: [{ id: "a", name: "a", author: "trk", version: "1.0.0", bytes: 10 }] }));

      const res = run([set, "--have=" + have, "--json"]);
      assert.equal(res.code, 0);
      const lines = res.out.trim().split("\n");
      assert.equal(lines.length, 1, "JSON は 1 行（機械が読みやすい）");
      const j = JSON.parse(lines[0]);
      assert.equal(j.tool, "check-set");
      assert.equal(typeof j.version, "number");
      assert.equal(j.ok, true);
      assert.equal(j.problems, 0);
      assert.equal(j.catalog.packs, 2);
      assert.equal(j.packs.length, 2);
      assert.ok(j.packs.every(p => p.ok === true));
      /* すでに入っている 1 本は飛ばし、これから入るのは 1 本（trk239 の数え方と同じ） */
      assert.equal(j.pending.installed, 1);
      assert.equal(j.pending.count, 1);
      assert.equal(j.pending.skip, 1);
      assert.equal(j.pending.bytes, 20);

      /* 開けないときも JSON で返す（reason を見れば分かる） */
      const broken = run([path.join(tmp, "nope.stlib"), "--json"]);
      assert.equal(broken.code, 2);
      assert.equal(JSON.parse(broken.out.trim()).ok, false);
      assert.equal(JSON.parse(broken.out.trim()).reason, "ファイルがありません");
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test("③ 契約の 4 つ（呼び方・終了コード・--json・--have）を、道具と書面の両方が書いている", () => {
    for (const s of ["--hash", "--have=", "--json", "終了コード", "決まりごと"]) assert.ok(toolSrc.includes(s), `${s} が道具に無い`);
    assert.ok(toolSrc.includes("const VERSION = 2;"));
    assert.ok(toolSrc.includes('const TOOL = "check-set";'));
    for (const s of ["node tools/check-set.mjs", "0", "1", "2", "--json", "--have"]) assert.ok(roles.includes(s), `書面に ${s} が無い`);
    assert.ok(roles.includes("§4-1") || roles.includes("4-1"));
  });
});

describe("trk240 役割の書面", () => {
  test("書体・スキンはミュージアム側、アプリ本体は trk-PWA 側と書いてある", () => {
    assert.ok(roles.includes("ミュージアム"));
    assert.ok(roles.includes("書体の製作・追加"));
    assert.ok(roles.includes("スキンの製作"));
    assert.ok(roles.includes("アプリ本体（PWA）"));
    /* 線の引き方の 3 原則 */
    for (const s of ["中身は作らない", "形は共有", "相手の領域の決定は相手"]) assert.ok(roles.includes(s), `${s} が無い`);
    /* これからの PWA の続き */
    for (const s of ["trk241", "trk242", "新しい版の知らせ", "配布の最終判断"]) assert.ok(roles.includes(s), `${s} が無い`);
  });
  test("両方に効く約束（CDN 禁止・オリジン・GPLv3・相談）が残っている", () => {
    for (const s of ["外部 API", "オフライン優先", "オリジン", "GPLv3", "force push"]) assert.ok(roles.includes(s), `${s} が無い`);
  });
  test("返事9 が書面と前の返事を指している", () => {
    for (const s of ["ROLES-TRK240-2026-11-01.md", "返事8", "--json", "ミュージアム"]) assert.ok(letter.includes(s), `${s} が無い`);
    assert.ok(letter.includes("check-set.mjs"));
  });
  test("HANDOFF から書面にたどれる（trk240 の行がある）", () => {
    assert.ok(handoff.includes("ROLES-TRK240-2026-11-01.md"));
    assert.ok(handoff.includes("trk240"));
  });
});

describe("trk240 アプリの殻は変えていない", () => {
  test("sw.js の cache は trk239 より後（trk240 では上げず、あとで殻を変えた版が上げる）", () => {
    /* trk240 自身は tools/ と docs/ だけなので trk239 のままでした。
       🧺 trk241 で index.html・js・css が変わったため、いまは trk241 です（trk239 のままなら赤）。 */
    const cur = sw.match(/const CACHE = "([^"]+)";/)[1];
    assert.ok(!cur.includes("trk239"), `trk239 のまま（${cur}）`);
    assert.ok(sw.includes("trk241") || /trk-v2026\.\d\d\.\d\d-trk2\d\d/.test(cur), cur);
  });
  test("道具は外へ取りに行かない（読むのは渡されたファイルだけ）", () => {
    const body = toolSrc.slice(toolSrc.indexOf("import fs"), toolSrc.indexOf("const args"));
    assert.equal(/https?:\/\//.test(body), false);
    assert.equal(/\bfetch\(/.test(toolSrc), false);
  });
});
