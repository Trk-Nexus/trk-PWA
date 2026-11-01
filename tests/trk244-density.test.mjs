// SPDX-License-Identifier: GPL-3.0-or-later
/* trk244: 🧱 表示の密度（余白・行間・列数を詰めて、1画面に多く出す）

   利用者さんの相談：「PC版では縮小化しても表示部分を減らして、全体の大きさを維持する等」
   　→ Clementine／MusicBee の Compact の考え方をヒントに、拡大率の「75%・50%」を
    　**文字を小さくする**のではなく**余白と行間を詰めて多く見せる**に使えるようにした（既定オン）。

   見張るもの：
   ・密度の段の計算（純粋関数）と、拡大率からの自動／手動の切り替わり
   ・125% は trk222 のまま「文字を大きく」が効く（縮小＝詰めるがオンのときも壊さない）
   ・JS は body へのクラス1つだけ出せる（DOM を作り直さない・font-size は触らない）
   ・4言語の文言・設定の欄・保存キー（uiDensity・uiScaleCompact）と工場出荷状態 */
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

/* ---------- 密度の計算（core.js から切り出して動かす） ---------- */
const start = coreSrc.indexOf('const UI_SCALES = [50, 75, 100, 125];');
const end = coreSrc.indexOf("const SCREENS = [");
assert.ok(start > 0 && end > start, "拡大率〜密度の塊が切り出せる");
const densityBlock = coreSrc.slice(start, end);

function ctx({ scale = 100, density = "normal", compact = true, fixedIconSize = true } = {}) {
  const sets = Object.create(null);
  const classes = new Set();
  const events = [];
  const sandbox = {
    document: {
      documentElement: { style: { setProperty(k, v) { sets[k] = v; } } },
      body: {
        classList: {
          toggle(name, on) { if (on) classes.add(name); else classes.delete(name); },
          contains(name) { return classes.has(name); },
        },
      },
    },
    innerWidth: 1440, innerHeight: 900,
    settings: { uiScale: scale, uiDensity: density, uiScaleCompact: compact, fixedIconSize },
    saveUserPrefs() { sandbox.saved = (sandbox.saved || 0) + 1; },
    emit(name, value) { events.push([name, value]); },
    fitStage() { sandbox.fitted = (sandbox.fitted || 0) + 1; },
  };
  vm.runInContext(
    `${densityBlock}\n;globalThis.__density = uiDensityValue; globalThis.__auto = uiDensityAuto;`,
    vm.createContext(sandbox)
  );
  return {
    sandbox, sets, classes, events,
    get saved() { return sandbox.saved || 0; },
    density: () => sandbox.__density(),
    auto: () => sandbox.__auto(),
    apply: opts => sandbox.applyUiScale(opts),
    fromScale: n => sandbox.densityFromScale(n),
    shrinks: n => sandbox.uiScaleShrinks(n),
    scaleValue: () => sandbox.uiScaleValue(),
  };
}

describe("trk244 密度の段の計算", () => {
  test("縮小（75%・50%）は「詰める」段になる（100%・125% は据え置き）", () => {
    assert.equal(ctx().fromScale(50), "dense", "50% はぎっしり");
    assert.equal(ctx().fromScale(75), "compact", "75% はぎゅっと");
    assert.equal(ctx().fromScale(100), "normal", "100% はふつう");
    assert.equal(ctx().fromScale(125), "normal", "125% は「字を大きく」なので密度は動かさない");
    for (const bad of [37, 0, -100, NaN, undefined, "80"]) {
      assert.equal(ctx().fromScale(bad), "normal", `${bad} は 100% として扱う（壊れた設定で崩れない）`);
    }
  });

  test("「縮小＝詰める」が対象にするのは 75%・50% の2つだけ", () => {
    for (const n of [50, 75, "50", "75"]) assert.equal(ctx().shrinks(n), true, `${n} は縮小側`);
    for (const n of [100, 125, 0, NaN, undefined]) assert.equal(ctx().shrinks(n), false, `${n} は縮小側ではない`);
  });

  test("自動で決まっているかは、詰め設定と拡大率で決まる", () => {
    assert.equal(ctx({ scale: 75 }).auto(), true, "75% ＋オン → 自動");
    assert.equal(ctx({ scale: 50 }).auto(), true, "50% ＋オン → 自動");
    assert.equal(ctx({ scale: 100 }).auto(), false, "100% は自動ではない（手動の段が効く）");
    assert.equal(ctx({ scale: 125 }).auto(), false, "125% も手動");
    assert.equal(ctx({ scale: 75, compact: false }).auto(), false, "オフにすれば 75% でも手動");
  });

  test("効いている密度：自動のあいだは拡大率から、オフにしたら選んだ段", () => {
    assert.equal(ctx({ scale: 75 }).density(), "compact", "75% → ぎゅっと");
    assert.equal(ctx({ scale: 50 }).density(), "dense", "50% → ぎっしり");
    assert.equal(ctx({ scale: 50, density: "roomy" }).density(), "dense",
      "自動のあいだは手動の段より拡大率が勝つ（選んでも効かない）");
    assert.equal(ctx({ scale: 50, density: "roomy", compact: false }).density(), "roomy",
      "オフにすると手動の段がそのまま効く");
    assert.equal(ctx({ scale: 100, density: "dense" }).density(), "dense",
      "100% でも density だけ詰める（拡大率を使わない密度の単独設定）");
    assert.equal(ctx({ scale: 100, density: "wat" }).density(), "normal", "知らない段は ふつう");
    assert.equal(ctx({ scale: 100, density: undefined }).density(), "normal", "未設定も ふつう");
  });
});

describe("trk244 画面への反映（applyUiScale）", () => {
  test("75%＋詰めオン：文字は 100% のまま、密度のクラスだけ乗る", () => {
    const c = ctx({ scale: 75 });
    c.apply({ persist: true });
    assert.equal(c.sets["--trk-ui-zoom"], "1", "ステージは小さく描かない（全体の大きさを維持）");
    assert.equal(c.sets["--trk-icon-zoom"], "1", "割り戻しも不要なので 1");
    assert.equal(c.classes.has("trk-zoom"), false, "trk-zoom は付かない（trk222 の縮小と取り違えない）");
    assert.equal(c.classes.has("trk-scale-compact"), true, "「詰めて多く見せる」が効いている印");
    assert.equal(c.classes.has("trk-density-compact"), true, "ぎゅっと");
    for (const other of ["roomy", "normal", "dense"]) assert.equal(c.classes.has("trk-density-" + other), false, other);
    assert.equal(c.saved, 1, "persist を頼めば1回だけ保存する");
    assert.deepEqual(c.events.map(e => e[0]).filter(n => n === "density"), ["density"], "密度を配る");
    assert.deepEqual(c.events.find(e => e[0] === "density")[1], "compact");
  });

  test("125% は trk222 のまま効く（詰めオンでも拡大を消さない）", () => {
    const c = ctx({ scale: 125 });
    c.apply();
    assert.equal(c.sets["--trk-ui-zoom"], "1.25", "拡大率はそのまま");
    assert.equal(c.sets["--trk-icon-zoom"], "0.8", "アイコン固定なら割り戻す");
    assert.equal(c.classes.has("trk-zoom"), true);
    assert.equal(c.classes.has("trk-scale-compact"), false, "125% は詰めの対象ではない");
    assert.equal(c.classes.has("trk-density-normal"), true, "密度は手動の段（既定は ふつう）");
  });

  test("詰めオフ（75%・50%）は、これまでどおり全体を小さく描く", () => {
    for (const [scale, zoom] of [[75, "0.75"], [50, "0.5"]]) {
      const c = ctx({ scale, compact: false });
      c.apply();
      assert.equal(c.sets["--trk-ui-zoom"], zoom, `${scale}% は ${zoom} 倍`);
      assert.equal(c.classes.has("trk-scale-compact"), false);
      assert.equal(c.classes.has("trk-density-normal"), true, "選んでいないので ふつう");
    }
    const dense = ctx({ scale: 50, compact: false, density: "dense" });
    dense.apply();
    assert.equal(dense.sets["--trk-ui-zoom"], "0.5", "拡大は効いたまま");
    assert.equal(dense.classes.has("trk-density-dense"), true, " density も同時に効く（二重に詰める）");
  });

  test("100%・詰めオンは何も変えない（既定の見た目は trk243 までと同じ）", () => {
    const c = ctx({ scale: 100 });
    c.apply();
    assert.equal(c.sets["--trk-ui-zoom"], "1");
    assert.equal(c.sets["--trk-icon-zoom"], "1");
    assert.equal(c.classes.has("trk-zoom"), false);
    assert.equal(c.classes.has("trk-scale-compact"), false);
    assert.equal(c.classes.has("trk-density-normal"), true);
    assert.equal(c.sandbox.fitted, 1, "ステージの合わせ込みは従来どおり呼ぶ");
  });

  test("密度を変えても DOM を作り直さない（棚を作り直す呼び出しは無い）", () => {
    const block = densityBlock;
    assert.equal(block.includes("buildSkinGrid"), false, "applyUiScale は buildSkinGrid() を呼ばない");
    assert.equal(block.includes("innerHTML"), false, "HTML を直接いじらない");
    assert.equal(/\bfetch\s*\(/.test(block), false, "外部を取りに行かない");
  });
});

describe("trk244 CSS（密度は余白・行間・列数だけ変える）", () => {
  test("既定の変数は trk243 までと同じ値（:normal で見た目を変えない）", () => {
    assert.ok(cssSrc.includes(":root{--trk-dens-pad:1;--trk-dens-gap:1;--trk-dens-line:1.5;--trk-skin-cols:3;--trk-lib-thumb:40px}"),
      "--trk-dens-* の既定は 1（＝詰めない）");
    assert.ok(cssSrc.includes("body.trk-density-normal{--trk-dens-pad:1;--trk-dens-gap:1;--trk-dens-line:1.5;--trk-skin-cols:3;--trk-lib-thumb:40px}"));
  });

  test("4段がそろっていて、詰めるほど余白が小さく・列数が増える", () => {
    const row = level => {
      const m = cssSrc.match(new RegExp(`body\\.trk-density-${level}\\{([^}]*)\\}`));
      assert.ok(m, `body.trk-density-${level} がある`);
      const out = Object.create(null);
      for (const part of m[1].split(";")) {
        const [k, v] = part.split(":");
        if (k) out[k.trim()] = parseFloat(v);
      }
      return out;
    };
    const roomy = row("roomy"), normal = row("normal"), compact = row("compact"), dense = row("dense");
    for (const key of ["--trk-dens-pad", "--trk-dens-gap", "--trk-dens-line", "--trk-skin-cols", "--trk-lib-thumb"]) {
      assert.ok([roomy, normal, compact, dense].every(v => Number.isFinite(v[key])), `${key} は4段すべてに数値`);
    }
    assert.ok(roomy["--trk-dens-pad"] > normal["--trk-dens-pad"], "ゆったりは余白ひろめ");
    assert.ok(compact["--trk-dens-pad"] < normal["--trk-dens-pad"], "ぎゅっとは余白せまめ");
    assert.ok(dense["--trk-dens-pad"] < compact["--trk-dens-pad"], "ぎっしりはさらにせまめ");
    assert.ok(dense["--trk-skin-cols"] > normal["--trk-skin-cols"], "詰めるほど棚の列は増える");
    assert.ok(dense["--trk-lib-thumb"] < normal["--trk-lib-thumb"], "詰めるほどジャケは小さく（＝行数は増える）");
    assert.ok(dense["--trk-dens-line"] < normal["--trk-dens-line"], "行間も詰める");
    assert.ok(dense["--trk-dens-line"] >= 1.2 && roomy["--trk-dens-line"] <= 1.8, "読める範囲（1.2〜1.8）に収める");
  });

  test("密度の段は font-size を変えない（文字は小さくしない、という約束）", () => {
    const densityRules = cssSrc.split("\n").filter(line => /^body\.trk-(density|scale)-?\w*[^{]*\{/.test(line));
    assert.ok(densityRules.length >= 5, "密度の規則が並んでいる");
    for (const line of densityRules) assert.equal(/font-size/.test(line), false, `font-size を入れていない：${line}`);
  });

  test("余白を使う欄は --trk-dens-* で計算される（既定 1 で従来の値）", () => {
    const pairs = [
      [".card{", "padding:calc(30px * var(--trk-dens-pad,1)) calc(36px * var(--trk-dens-pad,1))"],
      [".libRow{", "padding:calc(11px * var(--trk-dens-pad,1)) calc(16px * var(--trk-dens-pad,1))"],
      ["#skinGrid{", "grid-template-columns:repeat(var(--trk-skin-cols,3),minmax(0,1fr))"],
      [".libThumb{", "flex:0 0 var(--trk-lib-thumb,40px)"],
      [".hint{", "line-height:var(--trk-dens-line,1.5)"],
    ];
    for (const [sel, want] of pairs) {
      const a = cssSrc.indexOf(sel);
      assert.ok(a >= 0, sel);
      const rule = cssSrc.slice(a, cssSrc.indexOf("}", a));
      assert.ok(rule.includes(want), `${sel} に ${want}`);
    }
    /* 曲リストの高さは動かさない（行が短くなるぶん、同じ高さで多く見える） */
    /* 📐 trk245：高さは fitStage が置く --trk-lib-h の既定値になった（640px はそのまま素のときの値） */
    assert.ok(cssSrc.includes("height:var(--trk-lib-h,640px)"), "#libList の高さは --trk-lib-h（既定 640px）");
    assert.equal(/^#libList\{height:/m.test(cssSrc), false, "後の行で高さを上書きしない（trk245 で 320px 固定を外した）");
  });

  test("縮小＝詰めのときはカードを画面いっぱいにする（trk222 の trk-zoom と同じ書き方）", () => {
    assert.ok(cssSrc.includes("body.trk-scale-compact #stage .card{max-height:100%}"));
  });

  test("スマホ型は触れる大きさを優先して詰めすぎない", () => {
    assert.ok(cssSrc.includes("body.trk-mobile.trk-density-dense{--trk-skin-cols:4;--trk-lib-thumb:36px}"),
      "ぎっしりでもジャケは 36px まで");
    assert.ok(shellCss.includes(".trk-mobile .libRow { min-height: 52px; }"), "行の高さの床はそのまま");
  });
});

describe("trk244 設定・保存・文言", () => {
  test("既定は 窓の広さに自動・縮小＝詰めるはオン。工場出荷状態でもどる", () => {
    /* trk245 で 自動 が加わって5択・既定 auto（1920×1080 なら従来の ふつう と同じ） */
    assert.ok(coreSrc.includes('uiDensity: pick(prefs.uiDensity, ["auto", "roomy", "normal", "compact", "dense"], "auto")'),
      "uiDensity は5択・既定 auto");
    assert.ok(coreSrc.includes("uiScaleCompact: prefs.uiScaleCompact !== false"), "縮小＝詰めるは既定オン");
    assert.ok(coreSrc.includes('settings.uiDensity = "auto"; settings.uiScaleCompact = true;'),
      "工場出荷状態では既定へ戻す");
  });

  test("設定画面に4つの段と詰め設定の欄があり、status で理由を伝える", () => {
    assert.ok(html.includes('<select id="uiDensity">'), "密度の選択");
    for (const value of ['value="roomy"', 'value="normal"', 'value="compact"', 'value="dense"']) {
      assert.ok(html.includes(value), value);
    }
    assert.ok(html.includes('<input id="uiScaleCompact" type="checkbox">'), "縮小＝詰めるのチェック");
    assert.ok(/<div id="uiDensityState" class="hint status" role="status" aria-live="polite"><\/div>/.test(html),
      "自動で決まっていることは status で読み上げる");
  });

  test("ui-prefs は auto を core に聞き、密度を変えたら applyUiScale に頼む", () => {
    assert.ok(prefsSrc.includes('uiScaleCompact: "uiScaleCompact"'), "チェック欄の配線");
    assert.ok(prefsSrc.includes("core.uiDensityAuto"), "自動かどうかは自分で計算しない");
    assert.ok(prefsSrc.includes("core.settings.uiDensity = density.value"), "密度は core.settings へ");
    const idx = prefsSrc.indexOf("core.settings.uiDensity = density.value");
    assert.ok(prefsSrc.indexOf("core.applyUiScale({ persist: true })", idx) > idx, "反映と保存を頼む");
    assert.ok(prefsSrc.includes('if (id === "fixedIconSize" || id === "uiScaleCompact") core.applyUiScale({ persist: true });'),
      "詰め設定も applyUiScale を通す（もう1つの経路を作らない）");
    assert.equal(prefsSrc.includes("localStorage"), false, "ここから localStorage を触らない");
    for (const name of ["language", "settings", "skin", "uiscale"]) {
      assert.ok(prefsSrc.includes(`"${name}"`), `${name} の合図でも見直す（密度欄も）`);
    }
  });

  test("新しい保存キーは2つだけ（uiDensity・uiScaleCompact）", () => {
    const keys = ["uiDensity", "uiScaleCompact"];
    for (const key of keys) {
      const hits = coreSrc.match(new RegExp(`settings\\.${key}\\b|${key}:`, "g")) || [];
      assert.ok(hits.length >= 2, `${key} は読み書きそろっている（${hits.length}か所）`);
    }
    assert.equal((coreSrc.match(/"trk_ui_density"|'trk_ui_density'/g) || []).length, 0, "別の localStorage キーを作らない");
  });

  test("文言は4言語ぶん", () => {
    for (const key of ["uiDensityLabel", "uiDensityRoomy", "uiDensityNormal", "uiDensityCompact", "uiDensityDense",
      "uiDensityHint", "uiScaleCompactLabel", "uiScaleCompactHint", "uiDensityAuto"]) {
      const count = (i18nSrc.match(new RegExp(`\\b${key}:`, "g")) || []).length;
      assert.equal(count, 4, `${key} は4言語（ja/en/zh/ko）`);
    }
    for (const lang of ["ja", "en", "zh", "ko"]) {
      const a = i18nSrc.indexOf(`  ${lang}: {`);
      assert.ok(a > 0, `${lang} の辞書がある`);
      const block = i18nSrc.slice(a, i18nSrc.indexOf("\n  },", a));
      for (const key of ["uiDensityLabel", "uiDensityHint", "uiScaleCompactLabel", "uiScaleCompactHint", "uiDensityAuto"]) {
        const at = block.indexOf(`${key}:`);
        assert.ok(at > 0 && block.slice(at, at + 40).length > `${key}:`.length, `${lang} の ${key} に値がある`);
      }
    }
    /* 韓国語に日本語の句点（。）が残っていないこと（中国語の「。」は正しい表記なので数えない） */
    const koA = i18nSrc.indexOf("  ko: {");
    const koBlock = i18nSrc.slice(koA, i18nSrc.indexOf("\n  },", koA));
    assert.equal(/。/.test(koBlock), false, "ko に日本語の句点を残さない");
  });
});
