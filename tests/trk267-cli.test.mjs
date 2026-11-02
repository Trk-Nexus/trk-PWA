// SPDX-License-Identifier: GPL-3.0-or-later
/* ⌨ trk267：ターミナル（trk CLI）の見張り。
 *
 * ブラウザーを起動しないテストなので、`js/cli.js` の
 * 「純粋な計算（trk267）」の範囲を vm で読み、入力 → 出力だけを確かめます。
 * 配線（index.html・⚙ の入口・重ね表示・設定の保存）は本文の目印で確かめます。
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const src = read("js/cli.js");

const START = "/* ==================== 純粋な計算（trk267）";
const END = "/* ==================== 純粋な計算（trk267）ここまで";
const from = src.indexOf(START), to = src.indexOf(END);
assert.ok(from > 0 && to > from, "「純粋な計算（trk267）」の目印が見つかる");
const sandbox = { Object, Math, Number, String, Array, JSON };
vm.createContext(sandbox);
vm.runInContext(src.slice(from, to) + `
;globalThis.C = { CLI_COMMANDS, CLI_HELP, BUILTIN_SPELLS, parseLine, parseClock, formatClock,
  clampPercent, looksLikePath, pickTrack, splitSpells, pickCliSkin, execute };
`, sandbox, { filename: "js/cli.js#pure267" });
const C = sandbox.C;
/* vm の中の配列・オブジェクトは別の realm の Array／Object なので、
   deepEqual の前に素の JSON へ戻してから比べます（中身は同じでも参照が違うため）。 */
const plain = v => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const deepEq = (actual, expected, msg) => assert.deepEqual(plain(actual), expected, msg);

/* 偽の端末の外側（deps）。呼ばれた回数と引数を覚えます。 */
function fakeDeps(over = {}) {
  const calls = [];
  const deps = {
    calls,
    t: (key, vars) => (vars ? `${key}${JSON.stringify(vars)}` : key),
    name: it => it.title,
    src: it => it.source,
    tracks: () => [{ key: "a", title: "夜の曲", source: "folder" }, { key: "b", title: "朝の曲", source: "file" }],
    play: it => { calls.push(["play", it.key]); return Promise.resolve({ ok: true }); },
    playSpecial: kind => { calls.push(["special", kind]); return Promise.resolve({ ok: true, name: "曲" }); },
    current: () => ({ skin: "shadow", volume: 70, track: "" }),
    skins: () => [
      { id: "shadow", label: "シャドウ", cats: ["basic"], cli: false },
      { id: "terminal", label: "ターミナル", cats: ["basic"], cli: false },
      { id: "wizard-cli", label: "Wizard", cats: ["wizard", "dark"], cli: true }
    ],
    applySkin: id => { calls.push(["skin", id]); return id === "wizard-cli" || id === "terminal" ? { ok: true } : { ok: false, reason: "unknown" }; },
    volume: pct => { calls.push(["volume", pct]); return { ok: true }; },
    seek: sec => { calls.push(["seek", sec]); return sec > 900 ? { ok: false, reason: "beyond", max: 900 } : { ok: true }; },
    repeat: mode => { calls.push(["repeat", mode]); return { ok: true }; },
    shuffle: on => { calls.push(["shuffle", on]); return { ok: true }; },
    spells: () => ({ "repeat-all": "repeat all" }),
    saveSpell: (id, body) => { calls.push(["save", id, body]); return { ok: true }; },
    delSpell: id => { calls.push(["del", id]); return id === "repeat-all" ? { ok: false, reason: "builtin" } : { ok: true }; },
    listLimit: 40,
    ...over
  };
  return deps;
}
const run = async (line, deps = fakeDeps()) => ({ res: await C.execute(line, deps), deps });
const keys = res => res.out.map(o => o.text.replace(/\{.*$/, "").trim());

describe("trk267：1行の読み取り", () => {
  test("コマンドと引数に分ける（大文字・余分な空白も吸収）", () => {
    deepEq(C.parseLine("play 3"), { cmd: "play", args: ["3"], rest: "3", raw: "play 3" });
    assert.equal(C.parseLine("  PLAY   ").cmd, "play");
    deepEq(C.parseLine("play 3").args, ["3"]);
  });

  test("cast の中身は崩さずに rest で渡す", () => {
    const q = C.parseLine("cast skin terminal; volume 30");
    assert.equal(q.cmd, "cast");
    assert.equal(q.rest, "skin terminal; volume 30");
  });

  test("空行は cmd が空", () => {
    assert.equal(C.parseLine("   ").cmd, "");
    assert.equal(C.parseLine(null).cmd, "");
  });
});

describe("trk267：時刻の読み取り", () => {
  test("mm:ss・h:mm:ss・秒", () => {
    assert.equal(C.parseClock("1:30"), 90);
    assert.equal(C.parseClock("1:02:03"), 3723);
    assert.equal(C.parseClock("90"), 90);
    assert.equal(C.parseClock("0:00"), 0);
  });

  test("読めない値は null（勝手に寄せない）", () => {
    for (const bad of ["", "abc", "1:75", "-5", "1:2:3:4", null]) assert.equal(C.parseClock(bad), null);
  });

  test("表示は 1:30 / 1:02:03", () => {
    assert.equal(C.formatClock(90), "1:30");
    assert.equal(C.formatClock(3723), "1:02:03");
    assert.equal(C.formatClock(5), "0:05");
    assert.equal(C.formatClock(-1), "0:00");
  });

  test("音量は 0〜100 に寄せる（数でなければ null）", () => {
    assert.equal(C.clampPercent("80"), 80);
    assert.equal(C.clampPercent("150"), 100);
    assert.equal(C.clampPercent("-3"), 0);
    assert.equal(C.clampPercent("abc"), null);
  });
});

describe("trk267：曲を選ぶ（パスは受けない）", () => {
  const list = [{ title: "夜の曲" }, { title: "朝の曲" }, { title: "夜明け" }];

  test("番号は 1 から", () => {
    assert.equal(C.pickTrack(list, "2").item.title, "朝の曲");
    assert.equal(C.pickTrack(list, "1").index, 0);
    assert.equal(C.pickTrack(list, "9").kind, "none");
    assert.equal(C.pickTrack(list, "0").kind, "none");
  });

  test("曲名の部分一致（1件だけなら選ぶ・複数なら番号を促す）", () => {
    assert.equal(C.pickTrack(list, "朝").item.title, "朝の曲");
    assert.equal(C.pickTrack(list, "夜").kind, "many");
    assert.equal(C.pickTrack(list, "ない").kind, "none");
  });

  test("ファイルパスは受け付けない（設計書 §7-3）", () => {
    for (const bad of ["../secret.mp3", "C:/x.mp3", "~/music/a.mp3", "a/b.mp3", "a\\\\b.mp3"])
      assert.equal(C.pickTrack(list, bad).kind, "path", bad);
    assert.equal(C.looksLikePath("夜の曲"), false);
  });
});

describe("trk267：呪文の分解と、当てるスキン", () => {
  test("; と改行で区切る（空は落とす・12本まで）", () => {
    deepEq(C.splitSpells("skin terminal; volume 30"), ["skin terminal", "volume 30"]);
    deepEq(C.splitSpells("volume 10\nvolume 20\n"), ["volume 10", "volume 20"]);
    deepEq(C.splitSpells("  ;  "), []);
    assert.equal(C.splitSpells(Array.from({ length: 30 }, () => "volume 10").join(";")).length, 12);
  });

  test("auto は wizard を含むスキン → 無ければ terminal", () => {
    const withWiz = [{ id: "shadow", cats: ["basic"] }, { id: "terminal", cats: ["basic"] }, { id: "wizard-cli", cats: ["wizard"] }];
    assert.equal(C.pickCliSkin(withWiz, "auto"), "wizard-cli");
    assert.equal(C.pickCliSkin([{ id: "shadow", cats: ["basic"] }, { id: "terminal", cats: ["basic"] }], "auto"), "terminal");
    assert.equal(C.pickCliSkin([{ id: "shadow", cats: ["basic"] }], "auto"), "");
    assert.equal(C.pickCliSkin(withWiz, "terminal"), "terminal");
    assert.equal(C.pickCliSkin(withWiz, "keep"), "");
    assert.equal(C.pickCliSkin(null, "auto"), "");
  });
});

describe("trk267：唱える（help・list・play）", () => {
  test("help は 12 行の一覧", async () => {
    const { res } = await run("help");
    assert.equal(res.out[0].text, "cliHelpTitle");
    assert.equal(res.out.length, 1 + C.CLI_HELP.length);
    assert.ok(C.CLI_HELP.length >= 12);
  });

  test("list は番号つきで、曲名と出どころを出す", async () => {
    const { res } = await run("list");
    assert.equal(res.out[0].text, 'cliListTitle{"n":2,"from":1,"to":2}');
    assert.equal(res.out[1].text, 'cliListItem{"i":1,"name":"夜の曲","src":"folder"}');
  });

  test("曲が無いときは、その旨を返す", async () => {
    const { res } = await run("list", fakeDeps({ tracks: () => [] }));
    deepEq(keys(res), ["cliNoTracks"]);
  });

  test("play 1 は 1曲目を鳴らす", async () => {
    const deps = fakeDeps();
    const { res } = await run("play 1", deps);
    deepEq(deps.calls, [["play", "a"]]);
    deepEq(keys(res), ["cliPlaying"]);
  });

  test("play 曲名・next・fav も通る", async () => {
    const d1 = fakeDeps(); await run("play 朝", d1); deepEq(d1.calls, [["play", "b"]]);
    const d2 = fakeDeps(); await run("play next", d2); deepEq(d2.calls, [["special", "next"]]);
    const d3 = fakeDeps(); await run("play fav", d3); deepEq(d3.calls, [["special", "fav"]]);
  });

  test("番号も曲名も無い・パス・見つからない は、それぞれの理由で断る", async () => {
    deepEq(keys((await run("play")).res), ["cliNeedIndex"]);
    deepEq(keys((await run("play ../a.mp3")).res), ["cliPathRefused"]);
    deepEq(keys((await run("play 曲")).res), ["cliManyMatch"]);
    deepEq(keys((await run("play ない曲")).res), ["cliNoMatch"]);
  });
});

describe("trk267：唱える（skin・grimoire・volume・seek）", () => {
  test("skin は今のスキンを見せ、id を渡すと当てる", async () => {
    deepEq(keys((await run("skin")).res), ["cliSkinCurrent"]);
    const deps = fakeDeps();
    const { res } = await run("skin terminal", deps);
    deepEq(deps.calls, [["skin", "terminal"]]);
    deepEq(keys(res), ["cliSkinSet"]);
  });

  test("知らないスキンは断る", async () => {
    deepEq(keys((await run("skin nope")).res), ["cliSkinUnknown"]);
  });

  test("grimoire は一覧、カテゴリで絞れる", async () => {
    const all = await run("grimoire");
    assert.ok(all.res.out.some(o => o.text.includes("wizard-cli")));
    assert.ok(all.res.out.some(o => o.text.startsWith("⌨ ")));
    const dark = await run("grimoire dark");
    assert.equal(dark.res.out[0].text, 'cliGrimoireFilter{"cat":"dark","n":1}');
    deepEq(keys((await run("grimoire miku")).res), ["cliGrimoireNone"]);
  });

  test("volume は 0〜100 に寄せて渡す", async () => {
    const deps = fakeDeps();
    const { res } = await run("volume 150", deps);
    deepEq(deps.calls, [["volume", 100]]);
    deepEq(keys(res), ["cliVolumeSet"]);
    deepEq(keys((await run("volume たくさん")).res), ["cliVolumeNeed"]);
  });

  test("seek は秒に直して渡す・範囲外と曲なしは断る", async () => {
    const deps = fakeDeps();
    await run("seek 1:30", deps);
    deepEq(deps.calls, [["seek", 90]]);
    deepEq(keys((await run("seek 20:00")).res), ["cliSeekBeyond"]);
    deepEq(keys((await run("seek 1:75")).res), ["cliSeekNeed"]);
    const none = fakeDeps({ seek: () => ({ ok: false, reason: "none" }) });
    deepEq(keys((await run("seek 1:00", none)).res), ["cliSeekNoTrack"]);
  });

  test("repeat と shuffle は決まった値だけ受ける", async () => {
    const deps = fakeDeps();
    await run("repeat all", deps);
    await run("shuffle on", deps);
    deepEq(deps.calls, [["repeat", "all"], ["shuffle", true]]);
    deepEq(keys((await run("repeat 3")).res), ["cliRepeatNeed"]);
    deepEq(keys((await run("shuffle maybe")).res), ["cliNeedOnOff"]);
  });
});

describe("trk267：呪文（spell）と cast", () => {
  test("spell だけなら一覧と使い方", async () => {
    const { res } = await run("spell");
    deepEq(keys(res), ["cliSpellTitle", "cliSpellItem", "cliSpellUsage"]);
  });

  test("登録した呪文を唱えると、中のコマンドが順に走る", async () => {
    const deps = fakeDeps({ spells: () => ({ "night": "volume 30; seek 0:10" }) });
    const { res } = await run("spell night", deps);
    deepEq(deps.calls, [["volume", 30], ["seek", 10]]);
    deepEq(keys(res), ["cliVolumeSet", "cliSeekSet"]);
  });

  test("知らない呪文は断る", async () => {
    deepEq(keys((await run("spell nope")).res), ["cliSpellUnknown"]);
  });

  test("add は名前と中身を見てから覚える", async () => {
    const deps = fakeDeps();
    await run("spell add night skin terminal; volume 30", deps);
    deepEq(deps.calls, [["save", "night", "skin terminal; volume 30"]]);
    deepEq(keys((await run("spell add")).res), ["cliSpellUsage"]);
    deepEq(keys((await run("spell add わるい名前 volume 1")).res), ["cliSpellBadId"]);
    deepEq(keys((await run("spell add ok! volume 1")).res), ["cliSpellBadId"]);
  });

  test("del は最初からある呪文を消せない", async () => {
    deepEq(keys((await run("spell del repeat-all")).res), ["cliSpellBuiltin"]);
    const deps = fakeDeps();
    await run("spell del night", deps);
    deepEq(deps.calls, [["del", "night"]]);
  });

  test("cast は ; で続けて唱える。中の cast は断る", async () => {
    const deps = fakeDeps();
    await run("cast volume 20; repeat one", deps);
    deepEq(deps.calls, [["volume", 20], ["repeat", "one"]]);
    deepEq(keys((await run("cast cast volume 20")).res), ["cliNoNestedCast"]);
    deepEq(keys((await run("cast")).res), ["cliCastEmpty"]);
  });

  test("知らない呪文・quit の扱い", async () => {
    deepEq(keys((await run("abracadabra")).res), ["cliUnknown"]);
    const q = await run("quit");
    assert.equal(q.res.quit, true);
    assert.equal((await run("exit")).res.quit, true);
    assert.equal((await run("volume 10")).res.quit, false);
  });

  test("最初からある呪文は 3 本（設計書 §4.1）", () => {
    deepEq(Object.keys(C.BUILTIN_SPELLS).sort(), ["midnight", "repeat-all", "shuffle-fav"]);
    assert.ok(C.BUILTIN_SPELLS["midnight"].includes("volume 30"));
  });
});

describe("trk267：文言（4言語）と配線", () => {
  const block = lang => {
    const start = src.indexOf(`Object.assign(TEXT.${lang}, {`);
    const end = src.indexOf("\n  });", start);
    assert.ok(start > 0 && end > start, `${lang} の文言のかたまりが見つかる`);
    return src.slice(start, end);
  };
  const keysOf = text => new Set([...text.matchAll(/^\s{4}(cli[A-Za-z0-9]+):/gm)].map(m => m[1]));

  test("4言語の鍵がそろっている", () => {
    const ja = keysOf(block("ja"));
    assert.ok(ja.size >= 60, `文言が ${ja.size} 個`);
    for (const lang of ["en", "zh", "ko"]) deepEq([...keysOf(block(lang))].sort(), [...ja].sort(), lang);
  });

  test("使っている鍵は、どれかの言語に実在する", () => {
    const ja = keysOf(block("ja"));
    const used = [...src.matchAll(/\bt\("(cli[A-Za-z0-9]+)"/g)].map(m => m[1]);
    const missing = [...new Set(used)].filter(k => !ja.has(k));
    deepEq(missing, []);
  });

  test("⚙ の入口・script の順・重ね表示の名前", () => {
    const html = read("index.html");
    assert.ok(html.includes('id="cliOpenBtn"'));
    assert.ok(html.includes('id="cliPlaySel"') && html.includes('id="cliSkinSel"'));
    assert.ok(html.indexOf("js/media-player-mode.js") < html.indexOf("js/cli.js"), "cli.js はメディアプレーヤーの後ろ");
    const core = read("js/core.js");
    assert.ok(core.includes('{ study:false, media:false, synth:false, cli:false }'));
    assert.ok(core.includes('cliPlay: pick(prefs.cliPlay, ["media", "preview"], "media")'));
    assert.ok(core.includes('cliSkin: pick(prefs.cliSkin, ["auto", "terminal", "keep"], "auto")'));
    assert.ok(core.includes("cliSpells: cleanCliSpells(prefs.cliSpells)"));
    assert.ok(core.includes("settings.cliPlay = \"media\"; settings.cliSkin = \"auto\"; settings.cliSpells = {};"));
  });

  test("メディアプレーヤーへ渡す窓口がある", () => {
    const mp = read("js/media-player-mode.js");
    assert.ok(mp.includes("window.TrkMediaPlayer = { open:openMedia, close:closeMedia, isOpen:mediaActive, play:playSong,"));
    assert.ok(src.includes("window.TrkMediaPlayer"));
  });

  test("localStorage のキーを増やしていない（settings の中だけ）", () => {
    assert.ok(!/localStorage\./.test(src));
  });
});
