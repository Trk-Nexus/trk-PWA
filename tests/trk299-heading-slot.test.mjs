// SPDX-License-Identifier: GPL-3.0-or-later
/* trk299：見出し用の枠（heading）を、共通 UI の見出しにだけ当てる（段階2の項目3・E3）。
   見張ること：
   ・見出し（summary・.panel h3）だけが heading の書体。題字（.brand h1）は display のまま
   ・heading が無い組では見出しは従来どおり（クラスを張らない）
   ・使わないに戻すと heading の変数も空になり、クラスも外れる
   ・既定（未選定）では何も変わらない（body.trk-typo-on が無い） */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const css = read("css/style.css");
const typo = read("js/typography.js");

test("CSS：見出しは heading、題字は display（見出しのクラスが張られたときだけ）", () => {
  assert.ok(css.includes("body.trk-typo-heading details.panel>summary,body.trk-typo-heading .panel h3{font-family:var(--trk-typo-heading)}"));
  assert.ok(css.includes("body.trk-typo-on .brand h1,body.trk-typo-on details.panel>summary,body.trk-typo-on .panel h3{font-family:var(--trk-typo-display,var(--font))}"),
    "従来の display の行は残す（heading が無い組の見出しの戻り先）");
  assert.ok(!/trk-typo-heading[^{]*\.brand h1/.test(css), "題字には heading を当てない");
});

test("apply：heading がある組だけクラスを張り、無い組・未選定では外す", () => {
  assert.ok(typo.includes('if (vars.heading) body.classList.add("trk-typo-heading"); else body.classList.remove("trk-typo-heading");'));
  assert.ok(typo.includes('root.style.setProperty("--trk-typo-heading", vars.heading || "");'));
  assert.ok(typo.includes('body.classList.remove("trk-typo-heading");'), "使わないでは外す");
});

test("cssVars：heading は書体がある組にだけ入る（無ければ鍵ごと無い）", () => {
  assert.ok(typo.includes('if (name("heading")) out.heading = stack(name("heading"));'));
});

test("既定の見た目は変えない（未選定では body.trk-typo-on も heading の変数も張らない）", () => {
  assert.ok(typo.includes('body.classList.remove("trk-typo-on");'));
  assert.ok(typo.includes('root.style.setProperty("--trk-typo-heading", "");'));
});
