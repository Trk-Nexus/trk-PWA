// SPDX-License-Identifier: GPL-3.0-or-later
/* trk245: 🪟 密度を「窓の広さで自動」に ＋ 📐 曲リストの高さを画面に合わせる

   ・trk244 の密度（4段）に **自動** を足した（既定は 自動）。Clementine／MusicBee が窓の大きさで
     余白だけ詰めたり広げたりする考え方の、アプリ側での姿。
   ・曲リストの高さは 640px（そして後から効いていた 320px 固定）をやめて、
     ステージの設計高さから他欄を引いたぶんを使う（`--trk-lib-h`）。
   ・どちらも **文字の大きさ（font-size）は変えない**。 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const coreSrc = fs.readFileSync(`${ROOT}/js/core.js`, "utf8");
const cssSrc = fs.readFileSync(`${ROOT}/css/style.css`, "utf8");
const shellCss = fs.readFileSync(`${ROOT}/css/mobile-shell.css`, "utf8");
const html = fs.readFileSync(`${ROOT}/index.html`, "utf8");
const i18nSrc = fs.readFileSync(`${ROOT}/js/i18n.js`, "utf8");
const prefsSrc = fs.readFileSync(`${ROOT}/js/ui-prefs.js`, "utf8");

const start = coreSrc.indexOf('const UI_SCALES = [50, 75, 100, 125];');
const end = coreSrc.indexOf("const SCREENS = [");
assert.ok(start > 0 && end > start, "密度の塊が切り出せる");
const densityBlock = coreSrc.slice(start, end);
const fitStart = coreSrc.indexOf("function uiZoomFactor() {");
const fitEnd = coreSrc.indexOf('addEventListener("resize", fitStage);');
assert.ok(fitStart > 0 && fitEnd > fitStart, "fitStage が切り出せる");
const fitBlock = coreSrc.slice(fitStart, fitEnd);

function ctx({ scale = 100, density = "auto", compact = true, width = 1440, height = 900, classList = [] } = {}) {
  const sets = Object.create(null);
  const classes = new Set(classList);
  const events = [];
  const sandbox = {
    innerWidth: width, innerHeight: height,
    document: {
      documentElement: { style: { setProperty(k, v) { sets[k] = v; }, removeProperty(k) { delete sets[k]; } } },
      body: {
        classList: {
          toggle(name, on) { if (on) classes.add(name); else classes.delete(name); },
          contains(name) { return classes.has(name); },
        },
      },
    },
    stage: { dataset: { phase: "title" }, style: { width: "", height: "", transform: "" } },
    settings: { uiScale: scale, uiDensity: density, uiScaleCompact: compact, fixedIconSize: true },
    window: { Trk: { data: { W: 1920, H: 1080 } } },
    saveUserPrefs() { sandbox.saved = (sandbox.saved || 0) + 1; },
    emit(name, value) { events.push([name, value]); },
  };
  vm.runInContext(
    `${densityBlock}\n${fitBlock}\n;globalThis.__density = uiDensityValue; globalThis.__windowBox = uiWindowSize; globalThis.__fit = fitStage; globalThis.__apply = applyUiScale;`,
    vm.createContext(sandbox)
  );
  const api = {
    sandbox, sets, classes, events,
    get saved() { return sandbox.saved || 0; },
    density: () => sandbox.__density(),
    box: () => sandbox.__windowBox(),
    fit: () => sandbox.__fit(),
    apply: opts => sandbox.__apply(opts),
    fromWindow: (w, h) => sandbox.densityFromWindow(w, h),
    libH: h => sandbox.libListHeight(h),
  };
  return api;
}

describe("trk245 窓の広さから決める密度", () => {
  test("広い窓はゆったり、標準はふつう、狭い窓は詰める", () => {
    const c = ctx();
    assert.equal(c.fromWindow(2560, 1440), "roomy", "3.69M px² はゆったり");
    assert.equal(c.fromWindow(1920, 1080), "normal", "2.07M px² はふつう（既定の見た目を変えない）");
    assert.equal(c.fromWindow(1440, 900), "normal", "1.30M px²（ふつうの laptop）は詰まらない");
    assert.equal(c.fromWindow(1366, 768), "normal", "1.05M px² はふつう");
    assert.equal(c.fromWindow(1200, 700), "compact", "0.84M px² はぎゅっと");
    assert.equal(c.fromWindow(1000, 600), "compact", "0.60M px² はぎゅっと");
    assert.equal(c.fromWindow(900, 500), "compact", "0.45M px² は ぎゅっとの下限");
    assert.equal(c.fromWindow(800, 500), "dense", "0.40M px² はぎっしり");
  });

  test("狭い幅（縦長デスクトップ・小さい窓）はもう1段詰める", () => {
    const c = ctx();
    assert.equal(c.fromWindow(1440, 700), "normal", "1.01M かつ幅 1440 → そのまま ふつう");
    assert.equal(c.fromWindow(880, 900), "dense", "0.79M でぎゅっと、幅 880 でもう1段 → ぎっしり");
    assert.equal(c.fromWindow(890, 1200), "compact", "1.07M は ふつうのはずが、幅が狭いので ぎゅっと");
    assert.equal(c.fromWindow(1080, 1920), "normal", "縦長でも幅が 1080 あれば据え置き（高さではなく幅で判断する）");
    assert.equal(c.fromWindow(3000, 1400), "roomy", "幅も高さもあればゆったり");
    assert.equal(c.fromWindow(600, 900), "dense", "0.54M（ぎゅっと）＋幅 600 → ぎっしり");
  });

  test("読めない窓の値では崩れない（ふつうに落ちる）", () => {
    const c = ctx();
    for (const [w, h] of [[0, 0], [-1, 900], [NaN, 900], [undefined, undefined], ["1440", "abc"]]) {
      assert.equal(c.fromWindow(w, h), "normal", `${w}×${h}`);
    }
  });

  test("設定が auto のときは窓から、段を選んだらそれどおり、75%・50% の詰めは最優先", () => {
    assert.equal(ctx({ density: "auto", width: 800, height: 500 }).density(), "dense", "auto は窓");
    assert.equal(ctx({ density: "auto", width: 1920, height: 1080 }).density(), "normal", "1920×1080 は従来の見た目");
    assert.equal(ctx({ density: "roomy", width: 800, height: 500 }).density(), "roomy", "選んだ段が勝つ");
    assert.equal(ctx({ density: "auto", width: 2560, height: 1440, scale: 75 }).density(), "compact",
      "詰めオンの 75% は拡大率が最優先（窓より詰める）");
    assert.equal(ctx({ density: "wat", width: 800, height: 500 }).density(), "dense",
      "知らない値は auto として扱う（＝既定と同じ動き）");
    assert.equal(ctx({ density: "auto", width: 0, height: 0 }).density(), "normal",
      "窓の値が無ければ ふつう（jsdom・vm でも落ちない）");
  });

  test("uiWindowSize は innerWidth／innerHeight を読み、無い環境でも落ちない", () => {
    /* vm の中から出る値は別 realm なので、JSON に一回通して比べる */
    assert.deepEqual(JSON.parse(JSON.stringify(ctx({ width: 1234, height: 567 }).box())), { width: 1234, height: 567 });
    const bare = ctx({ width: 0, height: 0 });
    assert.deepEqual(JSON.parse(JSON.stringify(bare.box())), { width: 0, height: 0 }, "無い環境は 0（densityFromWindow が ふつう に落とす）");
  });
});

describe("trk245 曲リストの高さ（画面なり）", () => {
  test("設計高さから他欄（440px）を引いたぶんを使う。既定は 640px のまま", () => {
    const c = ctx();
    assert.equal(c.libH(1080), 640, "等倍（1920×1080 設計）は trk244 までと同じ 640px");
    assert.equal(c.libH(864), 424, "拡大率 125%（設計 864）は短く");
    assert.equal(c.libH(1440), 900, "75% の設計 1440 は 900px（上限）");
    assert.equal(c.libH(2160), 900, "50% の設計 2160 も 900px で止める（ card が伸びすぎないように）");
    assert.equal(c.libH(400), 320, "狭いところは 320px が床");
    for (const bad of [0, -10, NaN, undefined, "x"]) {
      assert.equal(c.libH(bad), 320, `${bad} は床（高さを見失っても空にならない）`);
    }
  });

  test("fitStage が --trk-lib-h を置く（密度のクラスも同時にそろえる）", () => {
    const normal = ctx({ scale: 100 });
    normal.fit();
    assert.equal(normal.sets["--trk-lib-h"], "640px", "等倍は 640px");
    assert.equal(normal.classes.has("trk-density-normal"), true, "1440×900 → ふつう");

    const zoomOut = ctx({ scale: 50, compact: false, classList: ["trk-zoom"] });
    zoomOut.fit();
    assert.equal(zoomOut.sets["--trk-lib-h"], "900px", "50%（設計 2160）は 900px まで伸ばす");

    const mobile = ctx({ scale: 100, classList: ["trk-mobile"] });
    mobile.fit();
    assert.equal(mobile.sets["--trk-lib-h"], "640px", "スマホ型でも高さは揃える（CSS が auto で上書きする）");
  });

  test("applyUiScale は密度のクラスを張り直し、棚を作り直さない", () => {
    const small = ctx({ density: "auto", width: 800, height: 500 });
    small.apply({ persist: true });
    assert.equal(small.classes.has("trk-density-dense"), true, "狭い窓 → ぎっしり");
    assert.equal(small.classes.has("trk-density-normal"), false, "前の段は残さない");
    assert.equal(small.saved, 1, "persist を頼めば1回だけ保存");
    assert.equal(densityBlock.includes("buildSkinGrid"), false, "棚は作り直さない");
    assert.equal(/\bfetch\s*\(/.test(densityBlock), false, "外部を取りに行かない");
  });

  test("リサイズでも見直す（fitStage が密度も決める）", () => {
    const c = ctx({ density: "auto", width: 3000, height: 1600 });
    c.fit();
    assert.equal(c.classes.has("trk-density-roomy"), true, "はじめはゆったり");
    c.sandbox.innerWidth = 800; c.sandbox.innerHeight = 500;
    c.fit();
    assert.equal(c.classes.has("trk-density-roomy"), false, "狭くなったら外す");
    assert.equal(c.classes.has("trk-density-dense"), true, "ぎっしりに");
    assert.equal(c.saved, 0, "リサイズでは保存しない（設定を書き換えない）");
  });
});

describe("trk245 設定・CSS・文言", () => {
  test("設定の欄に 自動 が増えている（既定・4択→5択）", () => {
    assert.ok(coreSrc.includes('uiDensity: pick(prefs.uiDensity, ["auto", "roomy", "normal", "compact", "dense"], "auto")'),
      "5択・既定 auto");
    assert.ok(coreSrc.includes('settings.uiDensity = "auto";'), "?reset=all でも auto");
    assert.ok(html.includes('<option value="auto" data-i18n="uiDensityAutoOption"></option>'), "選択肢に 自動");
    const at = html.indexOf('<select id="uiDensity">');
    assert.ok(html.indexOf('value="auto"', at) < html.indexOf('value="roomy"', at), "自動が先頭（既定）");
    assert.ok(coreSrc.includes('const UI_DENSITY_CHOICES = ["auto", "roomy", "normal", "compact", "dense"];'),
      "選択肢の表を core が出す（クラスは4つのまま）");
    assert.ok(coreSrc.includes('const UI_DENSITIES = ["roomy", "normal", "compact", "dense"];'),
      "body に出すクラスは4段だけ（trk-density-auto は作らない）");
    assert.equal(cssSrc.includes("trk-density-auto"), false, "CSS にも trk-density-auto を作らない");
  });

  test("CSS：高さは変数で受け、320px の上書きは無い", () => {
    assert.ok(cssSrc.includes("#libList{display:flex;flex-direction:column;gap:calc(5px * var(--trk-dens-gap,1));margin-top:calc(10px * var(--trk-dens-pad,1));height:var(--trk-lib-h,640px)"),
      "#libList の既定は 640px（js が無いときも従来どおり）");
    assert.equal(/#libList\{height:/.test(cssSrc), false, "後から高さを固定する行を作らない");
    assert.ok(shellCss.includes(".trk-mobile #libList { height: auto; max-height: none; overflow: visible; }"),
      "スマホ型は実ピクセルで並べる（高さを固定しない）");
    assert.ok(!/\Btrk-lib-h\b[^;]*font-size/.test(cssSrc), "高さの変数に font-size を混ぜない");
  });

  test("ui-prefs：自動のときは『何段にしているか』を書く（拡大率優先ならその理由）", () => {
    assert.ok(prefsSrc.includes('"uiDensityAutoOption"'), "自動の欄名も i18n キー経由（文字列を決め打ちしない）");
    assert.ok(prefsSrc.includes("core.UI_DENSITY_CHOICES"), "選択肢は core から");
    assert.ok(prefsSrc.includes('tr("uiDensityWindow"'), "自動のときは窓の大きさと段を書く");
    assert.ok(prefsSrc.includes('tr("uiDensityAuto", { n:'), "詰めオンの 75%・50% は拡大率から、と書く");
    assert.ok(prefsSrc.includes("density.disabled = auto;"), "拡大率優先のあいだだけ伏せる");
    assert.equal(prefsSrc.includes("localStorage"), false, "保存は core 経由");
  });

  test("文言は4言語ぶん・日本語の句点を韓国語に残さない", () => {
    for (const key of ["uiDensityAutoOption", "uiDensityWindow", "uiDensityHint", "uiDensityLabel"]) {
      const count = (i18nSrc.match(new RegExp(`\\b${key}:`, "g")) || []).length;
      assert.equal(count, 4, `${key} は4言語`);
    }
    const koA = i18nSrc.indexOf("  ko: {");
    const koBlock = i18nSrc.slice(koA, i18nSrc.indexOf("\n  },", koA));
    assert.ok(koBlock.includes("uiDensityAutoOption:"), "ko にも自動");
    assert.equal(/。/.test(koBlock), false, "ko に日本語の句点を残さない");
    for (const lang of ["ja", "en", "zh", "ko"]) {
      const a = i18nSrc.indexOf(`  ${lang}: {`);
      const block = i18nSrc.slice(a, i18nSrc.indexOf("\n  },", a));
      assert.ok(block.includes("{w}") && block.includes("{level}"), `${lang} の uiDensityWindow に変数がそろっている`);
    }
  });
});
