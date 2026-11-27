// SPDX-License-Identifier: GPL-3.0-or-later
/* 🧾 trk328：安定版を出す前の 2 つの修正（外部レビュー 2026-11-27 の M1・M3）の検算。

   守りたい約束：
     ・M1（生成の道具）：差し戻し（SKIN_HOLDBACK）は**その生成物に居る ID だけ**。
       gold-chip の居ない wizard のファイルに gold-chip を書かない（Avatar 側の互換検査が赤になる）。
     ・M3（フェード）：曲の終わりの N 秒から**外へ戻った**（巻き戻し・シーク）ら、下げた音量を元に戻す。
       ミュート中は触らない・設定の音量そのものは変えない。
     ・推奨：iOS ではフェードが効かないことを説明文に書く／更新直後に崩れたら開き直すと伝える。 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const playerSrc = fs.readFileSync(path.join(ROOT, "js/media-player-mode.js"), "utf8");
const i18nSrc = fs.readFileSync(path.join(ROOT, "js/i18n.js"), "utf8");

const pick = (src, re, label) => {
  const m = src.match(re);
  assert.ok(m, `${label} を抜き出せる`);
  return m[0];
};

/* ---------- M3：フェードの途中で巻き戻すと音量が戻る ---------- */
describe("フェード（trk327）の後始末", () => {
  const body = [
    pick(playerSrc, /function crossfadeSeconds\(\) \{[\s\S]*?\n\}/, "crossfadeSeconds()"),
    pick(playerSrc, /function baseVolume\(\) \{[^\n]*\n/, "baseVolume()"),
    pick(playerSrc, /function applyFadeOut\(\) \{[\s\S]*?\n\}/, "applyFadeOut()"),
  ].join("\n");

  function ctx(settings, video) {
    const core = { settings, video, videoReady: true };
    const sandbox = { core, Math, Number, console };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(`let fading = false;\n${body}\nwindow.__fade = applyFadeOut;`, sandbox, { filename: "js/media-player-mode.js#fade" });
    return sandbox;
  }
  const make = over => Object.assign({ duration: 100, currentTime: 0, paused: false, muted: false, volume: 0.8 }, over || {});

  test("終わりの N 秒では静かに下がる", () => {
    const video = make({ currentTime: 97 });
    const s = ctx({ mediaCrossfade: 5, musicVolume: 0.8 }, video);
    s.window.__fade();
    assert.ok(Math.abs(video.volume - 0.48) < 1e-9, `残り 3 秒／フェード 5 秒 → 0.8×3/5（いま ${video.volume}）`);
  });

  test("巻き戻して「終わりの N 秒」の外へ出たら、元の音量へ戻る（レビューの 0.8 → 0.28 のままを直す）", () => {
    const video = make({ currentTime: 97 });
    const s = ctx({ mediaCrossfade: 5, musicVolume: 0.8 }, video);
    s.window.__fade();
    assert.ok(video.volume < 0.8, "まず下がっている");
    video.currentTime = 20;             /* 2 秒地点へシークし直す（残り 80 秒＝フェードの外） */
    s.window.__fade();
    assert.equal(video.volume, 0.8, "下げた音量は元に戻る");
  });

  test("音量そのもの（musicVolume）は変えない・ミュート中は触らない", () => {
    const settings = { mediaCrossfade: 5, musicVolume: 0.8 };
    const video = make({ currentTime: 97 });
    const s = ctx(settings, video);
    s.window.__fade();
    assert.equal(settings.musicVolume, 0.8, "設定の音量は書き換えない");

    const muted = make({ currentTime: 97, muted: true, volume: 0 });
    const s2 = ctx({ mediaCrossfade: 5, musicVolume: 0.8 }, muted);
    s2.window.__fade();
    assert.equal(muted.volume, 0, "ミュート中は触らない");
    muted.currentTime = 20;
    s2.window.__fade();
    assert.equal(muted.volume, 0, "外へ戻ってもミュート中の音量は動かさない");
  });

  test("止めている間・フェードがオフのときは何もしない", () => {
    const paused = make({ currentTime: 97, paused: true });
    ctx({ mediaCrossfade: 5, musicVolume: 0.8 }, paused).window.__fade();
    assert.equal(paused.volume, 0.8, "一時停止中は下げない");

    const off = make({ currentTime: 97 });
    ctx({ mediaCrossfade: 0, musicVolume: 0.8 }, off).window.__fade();
    assert.equal(off.volume, 0.8, "既定（オフ）では何もしない");
  });
});

/* ---------- M1：差し戻しは「そのファイルに居る ID だけ」 ---------- */
describe("スキン目録の取り込み（M1）", () => {
  const colors = { bg: "#050505", panel: "#031406", text: "#e8ffe4", accent: "#39ff14", gold: "#ffb000", muted: "#9fe0a8", field: "#0a0a0a" };
  function run(catalogSkins, args) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trk328-"));
    const catalog = path.join(dir, "skins.json");
    const out = path.join(dir, "out.js");
    fs.writeFileSync(catalog, JSON.stringify({ format: "trk-avatar-library-skins", version: 1, skins: catalogSkins }));
    execFileSync(process.execPath, [path.join(ROOT, "tools/import-skin-catalog.mjs"), catalog, ...args, "--out=" + path.relative(ROOT, out)], { encoding: "utf8", cwd: ROOT });
    return fs.readFileSync(out, "utf8");
  }
  const wizardOnly = [{ id: "wizard-a", cat: ["wizard"], label: { ja: "A", en: "A", zh: "A", ko: "A" }, desc: { ja: "a", en: "a", zh: "a", ko: "a" }, colors }];

  test("gold-chip の居ない wizard の生成物に、差し戻しの一覧は書かない", () => {
    const code = run(wizardOnly, ["--cat=wizard"]);
    assert.match(code, /S\["wizard-a"\]/);
    assert.doesNotMatch(code, /SKIN_HOLDBACK/, "居ない ID を差し戻しに書かない（Avatar の互換検査が赤になる）");
  });

  test("そのファイルに居る差し戻しだけを書く（定義の 3 種を毎回足さない）", () => {
    /* gold-chip を名乗るスキンを「色の差で差し戻し」に落とすのは目録の値しだいなので、
       ここでは定義の ID を持つスキンを 1 枚だけ通し、**書かれる一覧が 1 種だけ**になることを見る */
    const skins = wizardOnly.concat([{ id: "gold-chip", cat: ["wizard"], label: { ja: "G", en: "G", zh: "G", ko: "G" }, desc: { ja: "g", en: "g", zh: "g", ko: "g" }, colors }]);
    const code = run(skins, ["--cat=wizard"]);
    const m = code.match(/SKIN_HOLDBACK = (\[[^\]]*\])/);
    assert.ok(m, "差し戻しを持つファイルには一覧が入る");
    const ids = JSON.parse(m[1]);
    for (const id of ids) assert.ok(code.includes(`S["${id}"]`), `${id} はこのファイルに居る`);
    assert.ok(!ids.includes("house-edge") && !ids.includes("orichalcum"), "居ない定義の ID は足さない");
  });
});

/* ---------- 推奨（文言） ---------- */
describe("安定版の前に足した 1 行", () => {
  test("フェードの説明に「iPhone・iPad では効かない」を 4 言語で書く", () => {
    for (const [lang, needle] of [["ja", "iPhone・iPad"], ["en", "iPhone and iPad"], ["zh", "iPhone・iPad"], ["ko", "iPhone・iPad"]]) {
      const hint = new RegExp(`mediaCrossfadeHint:"[^"]*${needle}[^"]*"`).exec(playerSrc);
      assert.ok(hint, `${lang} の説明に iOS の但し書きがある`);
    }
  });

  test("更新の知らせに「もう一度開き直す」を 4 言語で書く", () => {
    const ja = /swUpdateReady:"[^"]*もう一度開き直して[^"]*"/.test(i18nSrc);
    const en = /swUpdateReady:"[^"]*open the app once more[^"]*"/.test(i18nSrc);
    const zh = /swUpdateReady:"[^"]*再打开一次[^"]*"/.test(i18nSrc);
    const ko = /swUpdateReady:"[^"]*한 번 더 열어[^"]*"/.test(i18nSrc);
    assert.ok(ja && en && zh && ko, `4 言語そろっている（ja=${ja} en=${en} zh=${zh} ko=${ko}）`);
  });
});
