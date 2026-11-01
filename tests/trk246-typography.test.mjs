// SPDX-License-Identifier: GPL-3.0-or-later
/* trk246: 🔤 書体の組み合わせ（14組・見出し用の字だけ差し替える）

   出典は trk-Avatar-Library 側の `catalog/typography.json`（2026-11-01）。このアプリには
   **写しを JS データとして同梱**します（外部取得なし・オフライン可／woff2 は同梱しない）。
   守りたい約束は4つ：
     ・知らない値は捨てるだけ（古い版が読んでも壊れない）
     ・**選んでいない端末の見た目は1ピクセルも変わらない**（`body.trk-typo-on` ガード）
     ・書体パック未導入でも文字列は壊れない（`var(--font)` へ落ちる）
     ・**ゲーム画面の中（canvas の `ctx.font`）は触らない** */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const typoSrc = fs.readFileSync(`${ROOT}/js/typography.js`, "utf8");
const coreSrc = fs.readFileSync(`${ROOT}/js/core.js`, "utf8");
const cssSrc = fs.readFileSync(`${ROOT}/css/style.css`, "utf8");
const html = fs.readFileSync(`${ROOT}/index.html`, "utf8");
const i18nSrc = fs.readFileSync(`${ROOT}/js/i18n.js`, "utf8");
const swSrc = fs.readFileSync(`${ROOT}/sw.js`, "utf8");

function load({ fonts = null, withDocument = true } = {}) {
  const style = Object.create(null);
  const removed = [];
  const classes = new Set();
  const sandbox = {
    console,
    document: withDocument ? {
      fonts,
      body: { classList: { add: c => classes.add(c), remove: c => classes.delete(c) } },
      documentElement: {
        style: {
          setProperty(k, v) { style[k] = v; },
          removeProperty(k) { removed.push(k); delete style[k]; }
        }
      }
    } : null
  };
  sandbox.window = sandbox;
  vm.runInNewContext(typoSrc, sandbox);
  const T = sandbox.window.Trk.typography;
  return { T, style, removed, classes };
}

describe("目録（14組）", () => {
  test("14組で、id が重ならない", () => {
    const { T } = load();
    assert.equal(T.PAIRINGS.length, 14, "相手の catalog の14組をそのまま写す");
    const ids = new Set(T.PAIRINGS.map(p => p.id));
    assert.equal(ids.size, 14, "id は一意");
    for (const p of T.PAIRINGS) {
      assert.ok(p.name.length > 0 && p.why.length > 0, `${p.id} は名前と理由を持つ`);
    }
  });

  test("本文まわりは3家族まで（相手の check-typography と同じ目盛り）", () => {
    const { T } = load();
    for (const p of T.PAIRINGS) {
      const families = new Set(["display", "heading", "body", "caption"].map(k => p[k] && p[k].family).filter(Boolean));
      assert.ok(families.size <= 3, `${p.id} は見出しまわりでも4家族以上にしない（いま ${families.size}）`);
    }
    assert.deepEqual(JSON.parse(JSON.stringify(T.SCALES)), ["1.125", "1.2", "1.25", "1.333", "1.5"], "段階は5つ");
    assert.equal(T.BASE, 16, "本文16pxが基準");
  });
});

describe("sanitize（知らない値を捨てる）", () => {
  test("未選定・不明な組名・型違いは全部 null（＝使わない）", () => {
    const { T } = load();
    for (const bad of [null, undefined, "", 42, "shinbun", { pairing: "no-such-pair" }, { pairing: 42 }]) {
      assert.equal(T.sanitize(bad), null, `${JSON.stringify(bad)} は使わない扱い`);
    }
  });

  test("選んだ組のスロットがそのまま入り、書式の目印が付く", () => {
    const { T } = load();
    const clean = T.sanitize({ pairing: "shinbun" });
    assert.equal(clean.format, "trk-typography");
    assert.equal(clean.version, 1);
    assert.equal(clean.pairing, "shinbun");
    assert.equal(clean.preset, "pair", "いま app が描き方に使うのは2役（段階②）");
    assert.equal(clean.base, 16);
    assert.equal(clean.scale, "1.25");
    assert.equal(clean.slots.display.family, "TrkNotoSerifJP");
    assert.equal(clean.slots.display.weight, 700);
    assert.equal(clean.slots.body.family, "TrkNotoSansJP");
    for (const key of T.SLOTS) assert.ok(clean.slots[key], `${key} も保存側に残る（段階③の受け口）`);
  });

  test("未知の項目・範囲外は落としてから作り直す", () => {
    const { T } = load();
    const clean = T.sanitize({
      pairing: "kissa", evil: "<b>", futureStage: "roles",
      base: 999, scale: "9.9", preset: "nope",
      slots: { display: { family: 'Zen Maru", color:red', weight: 1234, bogus: 1 } }
    });
    assert.equal(clean.evil, undefined);
    assert.equal(clean.futureStage, undefined);
    assert.equal(clean.base, 40, "base は 8〜40 に挟む");
    assert.equal(clean.scale, "1.25", "知らない倍率はその組の値（無ければ 1.25）");
    assert.equal(clean.preset, "pair");
    assert.equal(clean.slots.display.family, "TrkKaiseiDecol", "壊れた書体名は組の値へ戻る");
    assert.equal(clean.slots.display.weight, 700);
    assert.equal(clean.slots.display.bogus, undefined, "スロットの未知項目も入れない");
  });

  test("custom は family 名だけ認める（引用符・セミコロンは通さない）", () => {
    const { T } = load();
    assert.deepEqual(JSON.parse(JSON.stringify(T.sanitizeSlot({ family: "Zen Maru", weight: 500 }))), { family: "Zen Maru", weight: 500 });
    for (const bad of ['"x"', "a;b", "font:inherit", "", "  ", "x".repeat(41)]) {
      assert.equal(T.sanitizeSlot({ family: bad }), null, `${JSON.stringify(bad)} は使わない`);
    }
    assert.equal(T.sanitizeSlot({ family: "Zen Maru", weight: 450 }).weight, 400, "太さは100刻みだけ");
    assert.equal(T.sanitizeSlot(null), null);
    assert.equal(T.sanitizeSlot("Zen Maru"), null, "文字列だけでの指定は取らない");
  });
});

describe("CSS 変数への集約", () => {
  test("見出しは display → heading、本文は body → caption。無ければ空（＝次の名前へ落ちる）", () => {
    const { T } = load();
    const full = T.cssVars(T.sanitize({ pairing: "shinbun" }));
    assert.equal(full.display, '"TrkNotoSerifJP",var(--font)');
    assert.equal(full.body, '"TrkNotoSansJP",var(--font)');
    assert.deepEqual(JSON.parse(JSON.stringify(T.cssVars(null))), { display: "", body: "" }, "未選定では何も置かない");
    const onlyHeading = T.cssVars({ slots: { heading: { family: "Zen Maru" }, caption: { family: "Zen Kaku" } } });
    assert.equal(onlyHeading.display, '"Zen Maru",var(--font)');
    assert.equal(onlyHeading.body, '"Zen Kaku",var(--font)');
  });

  test("apply は変数2本と trk-typo-on。使わないでは両方外す", () => {
    const { T, style, removed, classes } = load();
    T.apply(T.sanitize({ pairing: "monogatari" }));
    assert.equal(style["--trk-typo-display"], '"TrkYujiSyuku",var(--font)');
    assert.equal(style["--trk-typo-body"], '"TrkKaiseiTokumin",var(--font)');
    assert.ok(classes.has("trk-typo-on"));
    T.apply(null);
    assert.ok(!classes.has("trk-typo-on"), "クラスを外す＝見出しはスキンの字に戻る");
    assert.deepEqual(removed.sort(), ["--trk-typo-body", "--trk-typo-display"]);
    T.apply({ pairing: "no-such-pair" });
    assert.ok(!classes.has("trk-typo-on"), "知らない組名でも張りっぱなしにしない");
  });

  test("パック未導入（document.fonts 無し）でも当たれる", () => {
    const noFonts = load();
    assert.equal(noFonts.T.available(noFonts.T.sanitize({ pairing: "neon" })), null, "判定できない＝注記だけ出さない");
    const missing = load({ fonts: { check: () => false } });
    assert.equal(missing.T.available(missing.T.sanitize({ pairing: "neon" })), false);
    const present = load({ fonts: { check: () => true } });
    assert.equal(present.T.available(present.T.sanitize({ pairing: "neon" })), true);
    const { T, style } = missing;
    T.apply(T.sanitize({ pairing: "neon" }));
    assert.ok(style["--trk-typo-display"].includes("var(--font)"), "無い書体名でも文字列は壊れない（次へ落ちる）");
  });
});

describe("app 側の配線", () => {
  test("core.settings に入り、?reset=all で外れる（localStorage のキーは増やさない）", () => {
    assert.ok(/typography: \(window\.Trk && window\.Trk\.typography && window\.Trk\.typography\.sanitize\(prefs\.typography\)\) \|\| null,/.test(coreSrc),
      "保存済みでも壊れた値でも null か組の値のどちらか");
    assert.ok(/settings\.typography = null;/.test(coreSrc), "工場出荷状態は 使わない");
    assert.ok(!/localStorage\.(getItem|setItem)\([^)]*typography/.test(coreSrc), "専用の保存キーを作らない");
  });

  test("applySkin の中で当てる（スキンの --font を読み替える順番）", () => {
    const setSkin = coreSrc.indexOf('root.setProperty("--font"');
    const call = coreSrc.indexOf("window.Trk.typography.apply(settings.typography)");
    assert.ok(setSkin > 0 && call > setSkin, "--font を置いた後に apply する");
    assert.ok(coreSrc.slice(call - 400, call).includes("try {"), "無い環境（テスト・パック欠落）でも落ちない");
  });

  test("見出し類にだけ当たり、本文の font-size は変えない", () => {
    const rule = cssSrc.match(/body\.trk-typo-on \.brand h1[^}]*\}/);
    assert.ok(rule, "見出し類の規則がある");
    assert.ok(rule[0].includes("var(--trk-typo-display,var(--font))"));
    assert.ok(!/--trk-typo-display:|font-size:var\(--trk-typo/.test(cssSrc), "変数を受け取るだけで、大きさを変えない");
    const body = cssSrc.match(/body\.trk-typo-on \.hint[^}]*\}/);
    assert.ok(body && body[0].includes("var(--trk-typo-body,var(--font))"), "設定の説明文だけ本文用の字");
    assert.ok(!/\.libRow|\.panel \.song/.test(body[0]), "曲リストの行まで広げない");
  });

  test("ゲーム画面（canvas）は触らない", () => {
    assert.ok(!/ctx\.font\s*=|getContext/.test(typoSrc), "typography.js は canvas を知らない（コメントではなく式として）");
    const ctxFont = (coreSrc.match(/ctx\.font = /g) || []).length;
    assert.ok(ctxFont >= 0, `core.js 側の ctx.font はそのまま（${ctxFont}か所）`);
    for (const f of ["js/spectrum.js", "js/catch.js", "js/modes.js"]) {
      assert.ok(!fs.readFileSync(`${ROOT}/${f}`, "utf8").includes("--trk-typo"), `${f} に変数を漏らさない`);
    }
  });

  test("欄は1つ・選択肢は目録から・読み込み順", () => {
    assert.ok(/<select id="typoPairing">\s*<option value="" data-i18n="typoOff">/.test(html), "既定は 使わない");
    assert.ok(!/data-i18n="typoOff"[^>]*value="shinbun"/.test(html));
    const dataAt = html.indexOf('<script src="js/data.js"></script>');
    const typoAt = html.indexOf('<script src="js/typography.js"></script>');
    const coreAt = html.indexOf('<script src="js/core.js"></script>');
    assert.ok(dataAt > 0 && typoAt > dataAt && coreAt > typoAt, "data.js の後・core.js の前");
    assert.ok(fs.readFileSync(`${ROOT}/js/ui-prefs.js`, "utf8").includes("T.PAIRINGS"), "選択肢は JS が並べる");
  });

  test("4言語ぞろい", () => {
    for (const key of ["typoLabel", "typoOff", "typoHint", "typoState", "typoMissing"]) {
      assert.equal((i18nSrc.match(new RegExp(`\\b${key}:`, "g")) || []).length, 4, `${key} は4言語`);
    }
  });

  test("cache 名を上げる（JS を1つ増やしたので）", () => {
    const ver = swSrc.match(/const CACHE = "trk-v([\d.]+)-trk(\d+)";/);
    assert.ok(ver && Number(ver[2]) >= 246, `trk246 以降のcache名（日付は縛らない・実測 ${ver && ver[0]}）`);
  });
});

describe("trk253（2026-11-02 レビュー対応）", () => {
  test("描き方の段階は契約の4つだけ（役の名前は段階として通さない）", () => {
    const { T } = load();
    assert.deepEqual(JSON.parse(JSON.stringify(T.PRESETS)), ["one", "pair", "roles", "digits"], "契約（trk-typography v1）が認める4つだけ");
    for (const slot of T.SLOTS) {
      const v = T.sanitize({ pairing: "shinbun", preset: slot });
      assert.equal(v.preset, "pair", `役の名前 "${slot}" は段階として覚えない（既定の pair に倒す）`);
    }
    for (const name of T.PRESETS) {
      assert.equal(T.sanitize({ pairing: "shinbun", preset: name }).preset, name, `${name} は通る`);
    }
  });

  test("説明に書いた書体が、その組の実物のパックに入っている", () => {
    /* レビュー必須3の再発防止。「雑誌の飾り」は説明だけ「ひな明朝の見出し」で、実物は Kaisei Decol だった。
       別名テーブルに無い言い回し（「飾り明朝」「丸ゴ」「毛筆」などの雰囲気表現）は対象外にしています */
    const { T } = load();
    const ALIAS = [
      [/Noto Serif/, "noto-serif-jp"], [/Noto Sans/, "noto-sans-jp"],
      [/Zen Old Mincho/, "zen-old-mincho"], [/Zen Kaku/, "zen-kaku"],
      [/ひな明朝/, "hina-mincho"], [/しっぽり明朝/, "shippori-mincho"],
      [/Klee/, "klee-one"], [/Yomogi/, "yomogi"], [/Dela/, "dela-gothic"]
    ];
    for (const p of T.PAIRINGS) {
      for (const [re, id] of ALIAS) {
        if (!re.test(p.why)) continue;
        assert.ok(p.packs.some(x => x.includes(id)),
          `${p.id}: 説明に ${String(re.source)} とあるのに ${id}.stpack がパック一覧に無い（実測 ${p.packs.join(", ")}）`);
      }
    }
  });

  test("「雑誌の飾り」は実物どおりの説明にした", () => {
    const { T } = load();
    const z = T.PAIRINGS.find(p => p.id === "zasshi");
    assert.equal(z.why, "飾り明朝の題字と見出しに、しっぽり明朝の本文。紙の雑誌の感じ");
    assert.equal(z.heading.family, z.display.family, "見出しは題字と同じ飾り明朝（重みだけ違い）");
    assert.equal(z.heading.weight, 400);
    assert.equal(z.body.family, "TrkShipporiMincho");
  });
});
