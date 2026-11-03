// SPDX-License-Identifier: GPL-3.0-or-later
/* 🛣 trk282：道（揺れの作り）

   見張ること：
   ・抽選の重みは 山道 5／坂道 5／下り坂 5／海岸沿い 5／高速道路 80（合計 100）
   ・角度は「時間だけ」で決まる純粋関数。高速道路はいつでも 0（ビート揺れも止める）
   ・既定は「おまかせ」＝曲の頭で 1 回だけ引く。固定すれば毎回その道
   ・⚙ に「道の種類」があり、6 つの選択肢と 4 言語の文言がそろう
   ・trk281 の一回限りの移行は「静かな道（高速道路）」へ寄せる（オフ固定にしない） */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const truck = read("js/truck.js");
const html = read("index.html");
const game = read("js/game.js");
const core = read("js/core.js");
const levels = read("js/settings-level.js");

function extractFn(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${marker} がある`);
  const end = source.indexOf("\n}\n", start);
  assert.notEqual(end, -1, `${marker} の閉じかっこがある`);
  return source.slice(start, end + 3);
}

/* 道の関数だけを取り出して動かす（ブラウザの時計・乱数を差し替えられる形で） */
function makeRoad({ swayRoad = "auto", rand = 0.5 } = {}) {
  const constants = truck.slice(truck.indexOf("const ROAD_IDS ="), truck.indexOf("core.settings.swayRoad ="));
  const code = [
    constants,
    'let roadPick = "highway";',
    extractFn(truck, "function pickRoad("),
    extractFn(truck, "function resetRoad("),
    extractFn(truck, "function currentRoad("),
    extractFn(truck, "function roadAngle("),
  ].join("\n") + `
this.api = {
  ROAD_IDS, ROAD_WEIGHTS, pickRoad, resetRoad, currentRoad, roadAngle,
  pick: () => roadPick,
  set: v => { core.settings.swayRoad = v; },
};`;
  const math = Object.assign(Object.create(Math), { random: () => rand });
  const sandbox = { core: { settings: { swayRoad } }, Math: math, Number, isFinite, Array, console };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "js/truck.js#road" });
  return sandbox.api;
}

test("道の一覧と重み（5/5/5/5/80）", () => {
  const road = makeRoad();
  assert.deepEqual(Array.from(road.ROAD_IDS), ["auto", "highway", "mountain", "up", "down", "coast"],
    "おまかせ＋5 つの道");
  const weights = Array.from(road.ROAD_WEIGHTS, ([id, w]) => [id, w]);
  assert.deepEqual(weights, [["mountain", 5], ["up", 5], ["down", 5], ["coast", 5], ["highway", 80]],
    "山道 5／坂道 5／下り坂 5／海岸沿い 5／高速道路 80");
  assert.equal(weights.reduce((a, [, w]) => a + w, 0), 100, "重みの合計は 100");
  /* おまかせ（auto）は抽選に混ざらない（道そのものではない） */
  assert.ok(!weights.some(([id]) => id === "auto"), "おまかせは抽選の対象ではない");
});

test("抽選：0〜1 の乱数が 5/5/5/5/80 に分かれる", () => {
  const road = makeRoad();
  const counts = { mountain: 0, up: 0, down: 0, coast: 0, highway: 0 };
  for (let i = 0; i < 1000; i++) counts[road.pickRoad((i + 0.5) / 1000)]++;
  assert.deepEqual(counts, { mountain: 50, up: 50, down: 50, coast: 50, highway: 800 },
    "1000 回で 50/50/50/50/800");
  /* 境目は「以上で次の道」 */
  assert.equal(road.pickRoad(0), "mountain");
  assert.equal(road.pickRoad(0.0499), "mountain");
  assert.equal(road.pickRoad(0.05), "up");
  assert.equal(road.pickRoad(0.1), "down");
  assert.equal(road.pickRoad(0.15), "coast");
  assert.equal(road.pickRoad(0.2), "highway", "8 割は高速道路");
  assert.equal(road.pickRoad(1), "highway");
  /* 壊れた入力でも落ちない（0 に寄せる） */
  assert.equal(road.pickRoad(NaN), "mountain", "NaN は先頭（山道）に寄せる");
  assert.equal(road.pickRoad(-1), "mountain");
  assert.equal(road.pickRoad(undefined), "mountain");
});

test("角度は時間だけで決まる（乱数を使わない・同じ時刻なら同じ角度）", () => {
  const road = makeRoad();
  for (const id of ["highway", "mountain", "up", "down", "coast", "auto", ""]) {
    for (const p of [0, 1234, 9999, 60000]) {
      assert.equal(road.roadAngle(id, p), road.roadAngle(id, p), `${id || "(なし)"} は同じ値を返す`);
    }
  }
  /* 高速道路は「揺れない道」＝角度もビート揺れも 0（laneTilt が先に返す） */
  for (let p = 0; p <= 30000; p += 250) assert.equal(road.roadAngle("highway", p), 0, "高速道路は 0");
  assert.match(truck, /if \(truck && road === "highway"\) return 0;/, "ビート揺れ・ヒット揺れも止める");
});

test("道ごとの傾きの向きと大きさ", () => {
  const road = makeRoad();
  for (let p = 0; p <= 40000; p += 100) {
    const up = road.roadAngle("up", p);
    const down = road.roadAngle("down", p);
    const mountain = road.roadAngle("mountain", p);
    const coast = road.roadAngle("coast", p);
    assert.ok(up < 0, "坂道は上へ（マイナス）");
    assert.ok(down > 0, "下り坂は下へ（プラス）");
    assert.ok(-2.1 <= up && up <= -1.5, "坂道は 1.8 度ほど＋ゆらぎ");
    assert.ok(1.5 <= down && down <= 2.1, "下り坂は 1.8 度ほど＋ゆらぎ");
    assert.ok(Math.abs(mountain) <= 2, "山道は ±2 度に収まる");
    assert.ok(mountain !== 0 || p === 0, "山道は動く");
    assert.ok(0 <= coast && coast <= 1.8, "海岸沿いは片側へ寄る（0〜1.8 度）");
  }
  /* 山道は「蛇行」＝符号が両方に出る */
  const signs = new Set();
  for (let p = 0; p <= 20000; p += 50) signs.add(Math.sign(road.roadAngle("mountain", p)));
  assert.ok(signs.has(-1) && signs.has(1), "山道は左右へ振れる");
});

test("おまかせは曲ごとに 1 回だけ引く／固定すると毎回その道", () => {
  /* おまかせ：乱数 0.01 → 山道（先頭 5%） */
  const auto = makeRoad({ rand: 0.01 });
  assert.equal(auto.currentRoad(), "highway", "まだ引いていないときは静かな道");
  assert.equal(auto.resetRoad(), "mountain", "曲の頭で引く");
  assert.equal(auto.pick(), "mountain");
  assert.equal(auto.currentRoad(), "mountain", "おまかせは引いた道を使う");
  /* 引いた道は、次に引くまで変わらない（毎フレーム引き直さない） */
  assert.equal(auto.currentRoad(), "mountain");
  assert.equal(auto.resetRoad(), "mountain");

  /* 乱数 0.9 → 高速道路（8 割の側） */
  const quiet = makeRoad({ rand: 0.9 });
  assert.equal(quiet.resetRoad(), "highway");
  assert.equal(quiet.currentRoad(), "highway");

  /* 固定：引いても使わない（⚙ で選んだ道が勝つ） */
  for (const id of ["highway", "mountain", "up", "down", "coast"]) {
    const fixed = makeRoad({ swayRoad: id, rand: 0.01 });
    fixed.resetRoad();
    assert.equal(fixed.currentRoad(), id, `${id} に固定すると毎回 ${id}`);
    assert.equal(fixed.pick(), "mountain", "引いた結果は残るが使わない");
  }
  /* 固定から「おまかせ」へ戻すと、いま引いてある道に戻る */
  const back = makeRoad({ rand: 0.15 });
  back.resetRoad();
  back.set("coast");
  assert.equal(back.currentRoad(), "coast");
  back.set("auto");
  assert.equal(back.currentRoad(), "coast", "おまかせへ戻すと、この曲の道");
});

test("既定は「おまかせ」で、選んだ道は保存される", () => {
  assert.match(truck, /core\.settings\.swayRoad = core\.pick\(core\.prefs\.swayRoad, ROAD_IDS, "auto"\);/, "既定はおまかせ");
  assert.match(truck, /const roadSel = core\.\$\(("|')swayRoad\1\)/);
  assert.match(truck, /roadSel\.value = core\.settings\.swayRoad;/, "開いたときに今の道を出す");
  assert.match(truck, /core\.settings\.swayRoad = ROAD_IDS\.includes\(v\) \? v : "auto";/, "知らない値は おまかせ に寄せる");
  assert.match(truck, /if \(core\.settings\.swayRoad === "auto"\) resetRoad\(\);/, "おまかせへ戻したら引き直す");
  assert.match(truck, /core\.saveUserPrefs\(\);/, "選ぶと保存する");
});

test("曲の頭で道を引く（resetRoad は resetRun の中）", () => {
  const start = game.indexOf("function resetRun(");
  assert.notEqual(start, -1, "resetRun がある");
  const region = game.slice(start, game.indexOf("\nfunction ", start + 10));
  assert.match(region, /resetTruck\(\); resetLives\(\); resetOrbit\(\);/, "いつもの初期化の隣");
  assert.match(region, /if \(typeof resetRoad === "function"\) resetRoad\(\);/, "曲の頭で 1 回引く");
  assert.match(truck, /function resetRoad\(\) \{ roadPick = pickRoad\(Math\.random\(\)\); return roadPick; \}/);
});

test("⚙ に「道の種類」（6 つの選択肢・4 言語の文言）", () => {
  assert.match(html, /id="swayRoad"/, "設定の操作子がある");
  const start = html.indexOf('id="swayRoad"');
  const select = html.slice(start, html.indexOf("</select>", start));
  for (const v of ["auto", "highway", "mountain", "up", "down", "coast"]) {
    assert.match(select, new RegExp(`<option value="${v}"`), `${v} がある`);
  }
  assert.match(html, /data-i18n="swayRoadHint"/, "探す人向けの説明を添える");
  for (const key of ["swayRoadLabel", "swayRoadAuto", "swayRoadHighway", "swayRoadMountain",
    "swayRoadUp", "swayRoadDown", "swayRoadCoast", "swayRoadHint"]) {
    assert.equal((truck.match(new RegExp(`\\b${key}:`, "g")) || []).length, 4, `${key} は 4 言語`);
  }
  /* 酔いやすい人が「スタンダード」でも見つけられる（ほかの揺れの設定はプロ） */
  assert.match(levels, /swayRoad: 2,/, "道の種類はスタンダードから見える");
  assert.match(levels, /swayTitle: 3,/, "揺れのまとまり全体はプロのまま");
});

test("TRUCK の揺れは既定オンでも、8 割は静かな道（酔い対策）", () => {
  assert.match(truck, /core\.settings\.swayTruck = core\.prefs\.swayTruck !== false;/, "既定オン");
  /* 移行：保存がある人だけ高速道路へ（初めての人は おまかせ のまま） */
  assert.match(truck, /if \(Object\.keys\(core\.prefs \|\| \{\}\)\.length\) core\.settings\.swayRoad = "highway";/);
  assert.match(core, /swayTruckOff1: prefs\.swayTruckOff1 === 1 \? 1 : 0/);
  /* オフにすれば道に関係なく止まる（設定は残る） */
  assert.match(truck, /if \(m === "truck"\) return core\.settings\.swayTruck !== false;/);
  assert.match(truck, /function laneTilt\(now\) \{\n  if \(reduceMotion\.matches \|\| !swayModeOn\(\)\) return 0;/,
    "端末の「動きを減らす」も最優先");
});
