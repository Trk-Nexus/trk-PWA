// SPDX-License-Identifier: GPL-3.0-or-later
/* trk254: 🔤 の**写し**が、固定した目録（trk-Avatar-Library）とズレていないかを見る
   （返事15 §2「trk-PWA の写しは自動では届きません。手取り直しをお願いします」と、レビュー推奨 C-3 の約束）

   ・オフラインで走ります（`tests/fixtures/` に相手のファイルをそのまま固定してある）
   ・**先方だけが進んでいないか**は `node tools/sync-typography-catalog.mjs --against=main --check`（通信が必要）
   ・写しを作るのは `tools/sync-typography-catalog.mjs`。ここでの期待値は**独立に**目録から作るので、
     道具が暴走しても気づけます */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { ROOT } from "./helpers/browser-data.mjs";

const CAT = `${ROOT}/tests/fixtures/avatar-library-typography.json`;
const META = `${ROOT}/tests/fixtures/avatar-library-typography.meta.json`;
const ROLES = ["display", "heading", "body", "caption", "numeral", "accent"];

const read = p => fs.readFileSync(p, "utf8");
const appCopy = () => JSON.parse(read(`${ROOT}/js/typography.js`).match(/const PAIRINGS = (\[.*\]);/)[1]);

test("固定版の sha256 がメタと一致する（写しの元が入れ替わっていない）", () => {
  const text = read(CAT);
  const meta = JSON.parse(read(META));
  assert.equal(crypto.createHash("sha256").update(text, "utf8").digest("hex"), meta.sha256,
    "tests/fixtures/avatar-library-typography.json がメタと違います（tools/sync-typography-catalog.mjs で取り直して）");
  assert.equal(Buffer.byteLength(text, "utf8"), meta.bytes, "バイト数もそろっている");
  assert.equal(meta.source, "Trk-Nexus/trk-Avatar-Library");
  assert.equal(meta.file, "catalog/typography.json");
  assert.match(meta.ref, /^[0-9a-f]{40}$/, "どの ref から取ったかが残っている");
  assert.equal(meta.pairings, 14);
});

test("写しは目録から機械的に作れる（14組・全フィールド）", () => {
  const pairs = JSON.parse(read(CAT)).pairings;
  assert.equal(pairs.length, 14, "目録は14組");
  const want = pairs.map(p => {
    const out = { id: p.id, name: p.name, why: p.why, useFor: p.useFor };
    if (p.trkUse) out.trkUse = p.trkUse;
    out.tags = p.tags;
    out.scale = String(p.scale);
    const trk = p.tracking || {}, led = p.leading || {};
    for (const role of ROLES) {
      const s = (p.slots || {})[role];
      if (!s) continue;
      const one = { family: s.family, weight: s.weight };
      if (typeof trk[role] === "number") one.tracking = trk[role];
      if (typeof led[role] === "number") one.leading = led[role];
      out[role] = one;
    }
    out.packs = (p.packs || []).map(x => String(x).replace(/^font-packs\//, ""));
    return out;
  });
  assert.deepEqual(appCopy(), want, "js/typography.js の PAIRINGS は目録の写し（手で変えたら道具で戻す）");
});

test("r9 の直しが写っている（雑誌の飾りの見出し＝ひな明朝／電子ゲームの注記＝角ゴ）", () => {
  const copy = appCopy();
  const zasshi = copy.find(p => p.id === "zasshi");
  assert.equal(zasshi.heading.family, "TrkHinaMincho");
  assert.ok(zasshi.packs.includes("hina-mincho.stpack"), "使った書体のパックが組のパック一覧に入っている");
  const denshi = copy.find(p => p.id === "denshi");
  assert.equal(denshi.caption.family, "TrkZenKaku", "「電子ゲーム」の注記は角ゴ（自分の注意書きと食い違わない）");
});

test("契約の追加項目 trkUse が14組にあり、相手の検査と同じ長さ規定を守る", () => {
  for (const p of appCopy()) {
    assert.equal(typeof p.trkUse, "string", `${p.id} に trkUse がある（返事15 §3 B-3）`);
    const len = [...p.trkUse].length;
    assert.ok(len >= 1 && len <= 34, `${p.id} の trkUse は1〜34字（実測 ${len}）`);
  }
});

test("JS を変えたので cache 名が上がっている", () => {
  const ver = read(`${ROOT}/sw.js`).match(/const CACHE = "trk-v([\d.]+)-trk(\d+)";/);
  assert.ok(ver && Number(ver[2]) >= 254, `trk254 以降のcache名（実測 ${ver && ver[0]}）`);
});
