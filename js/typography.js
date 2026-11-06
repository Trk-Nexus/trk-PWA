// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 🔤 書体の組み合わせ（trk246 → trk254） ============

   trk-Avatar-Library 側の `catalog/typography.json` を、**このアプリがそのまま読める形**で写したものです
   （外部取得なし・オフラインで動きます）。**trk254 から手写しをやめました**：
   `node tools/sync-typography-catalog.mjs --from=<catalog> --ref=<sha>` が相手の目録から `PAIRINGS` を作り直し、
   取り込んだ目録そのものを `tests/fixtures/avatar-library-typography.json`（sha256・ref は隣の `.meta.json`）に固定します。
   上の `PAIRINGS`（14組）は**手で直さないでください**（`tests/trk254-typography-copy.test.mjs` が目録とズレを検出します）。
   書体ファイル（woff2）は**同梱していません**：14組が参照するパックは28パックで合計 61,652,655 B（61.65 MB）あるため、
   相手の `TRK-FONTS` の保存を借りる形にしています。`packs` にパック名だけ書いてあり、
   未導入の端末では `font-family` が次の名前へ自然にフォールバックします（＝崩れない・見本だけ縮む）。

   ・**いま app が描き方に使うのは2役だけ**：`display`（題字）と `body`（本文）。
     残り4役（`heading`／`caption`／`numeral`／`accent`）は**保存できる形にしてあるが、まだ使いません**
     （段階③ `roles` の受け口。相手の設計メモ §5 の4段階のうち、②までをここで受け取る）。
   ・保存は `settings.typography`（`core.settings` の中。localStorage のキーは増やさない）。
   ・知らない項目・壊れた値は `sanitize()` が捨てる（`sanitizeSkinDef` と同じ方針）。
   ・**canvas 内（`ctx.font`）は触らない**（見え方は実機で決めるため。js/spectrum.js 等はそのまま）。 */
(() => {
  "use strict";
  const PAIRINGS = [{"id":"shinbun","name":"新聞の顔","why":"Noto Serif の太字を題字に、本文は Noto Sans。いちばん間違いの少ない組み合わせ","useFor":"ニュース・お知らせ・説明の多い画面","trkUse":"オーソドックスな和風曲・演歌・バラード","tags":["定番","明朝","読みやすい"],"scale":"1.25","display":{"family":"TrkNotoSerifJP","weight":700,"tracking":0,"leading":1.1},"heading":{"family":"TrkNotoSerifJP","weight":700,"tracking":0.02,"leading":1.35},"body":{"family":"TrkNotoSansJP","weight":400,"tracking":0.02,"leading":1.8},"caption":{"family":"TrkNotoSansJP","weight":400,"tracking":0.06,"leading":1.5},"numeral":{"family":"TrkNotoSansJP","weight":500},"accent":{"family":"TrkNotoSerifJP","weight":700},"packs":["noto-sans-jp.stpack","noto-serif-jp.stpack"]},{"id":"shigoto","name":"まじめな仕事","why":"Zen Kaku を軸に、太さだけで差をつける。迷ったらここへ戻る","useFor":"設定画面・一覧・ふだん使い","trkUse":"どんな曲でも。迷ったときの既定","tags":["角ゴ","定番","軽い"],"scale":"1.2","display":{"family":"TrkZenKaku","weight":700,"tracking":0,"leading":1.1},"heading":{"family":"TrkZenKaku","weight":700,"tracking":0.02,"leading":1.35},"body":{"family":"TrkZenKaku","weight":400,"tracking":0.02,"leading":1.8},"caption":{"family":"TrkZenKaku","weight":400,"tracking":0.06,"leading":1.5},"numeral":{"family":"TrkNotoSansJP","weight":500},"accent":{"family":"TrkZenKaku","weight":700},"packs":["noto-sans-jp.stpack","zen-kaku.stpack"]},{"id":"ryokan","name":"旅館のしおり","why":"Shippori の太字題字に、Zen Old Mincho の本文。和風でも読める","useFor":"和風の紹介・しおり・季節の挨拶","trkUse":"和風の曲・季節もの・旅情","tags":["和風","明朝","余白"],"scale":"1.333","display":{"family":"TrkShipporiMincho","weight":700,"tracking":0,"leading":1.1},"heading":{"family":"TrkShipporiMincho","weight":400,"tracking":0.02,"leading":1.35},"body":{"family":"TrkZenOldMincho","weight":400,"tracking":0.02,"leading":1.8},"caption":{"family":"TrkSawarabiMincho","weight":400,"tracking":0.06,"leading":1.5},"numeral":{"family":"TrkNotoSansJP","weight":400},"accent":{"family":"TrkYujiSyuku","weight":400},"packs":["noto-sans-jp.stpack","sawarabi-mincho.stpack","shippori-mincho.stpack","yuji-syuku.stpack","zen-old-mincho.stpack"]},{"id":"kissa","name":"喫茶とサロン","why":"飾り明朝の題字に、丸ゴの本文。かわいくても読みやすい","useFor":"カフェ・サロン・手づくり品の紹介","trkUse":"ジャズ・ボサノバ・カフェ系のスキン","tags":["かわいい","丸ゴ","明朝"],"scale":"1.25","display":{"family":"TrkKaiseiDecol","weight":700,"tracking":0,"leading":1.1},"heading":{"family":"TrkKaiseiDecol","weight":400,"tracking":0.02,"leading":1.35},"body":{"family":"TrkZenMaru","weight":400,"tracking":0.02,"leading":1.8},"caption":{"family":"TrkMPlusRounded","weight":400,"tracking":0.06,"leading":1.5},"numeral":{"family":"TrkZenMaru","weight":400},"accent":{"family":"TrkYomogi","weight":400},"packs":["kaisei-decol.stpack","m-plus-rounded.stpack","maru-go.stpack","yomogi.stpack"]},{"id":"kodomo","name":"こどもとイベント","why":"もちもちの題字に、丸ゴの本文。にぎやかでも崩れない","useFor":"子ども向け・イベント・お祭り","trkUse":"童謡・アニメ曲・明るいポップ","tags":["ポップ","丸ゴ","元気"],"scale":"1.333","display":{"family":"TrkMochiyPop","weight":400,"tracking":0,"leading":1.1},"heading":{"family":"TrkPottaOne","weight":400,"tracking":0.02,"leading":1.35},"body":{"family":"TrkMPlusRounded","weight":400,"tracking":0.02,"leading":1.8},"caption":{"family":"TrkMPlusRounded","weight":400,"tracking":0.06,"leading":1.5},"numeral":{"family":"TrkPottaOne","weight":400},"accent":{"family":"TrkHachiMaru","weight":400},"packs":["hachi-maru-pop.stpack","m-plus-rounded.stpack","mochiy-pop.stpack","potta-one.stpack"]},{"id":"poster","name":"セールのポスター","why":"Dela の極太を題字に。離れていても読める","useFor":"セール・告知・LP の大見出し","trkUse":"盛り上がる曲・セール的なスキン","tags":["極太","ポップ","見出し"],"scale":"1.5","display":{"family":"TrkDelaGothic","weight":400,"tracking":0,"leading":1.1},"heading":{"family":"TrkPottaOne","weight":400,"tracking":0.02,"leading":1.35},"body":{"family":"TrkNotoSansJP","weight":700,"tracking":0.02,"leading":1.8},"caption":{"family":"TrkNotoSansJP","weight":400,"tracking":0.06,"leading":1.5},"numeral":{"family":"TrkTrainOne","weight":400},"accent":{"family":"TrkRocknRoll","weight":400},"packs":["dela-gothic.stpack","noto-sans-jp.stpack","potta-one.stpack","rocknroll-one.stpack","train-one.stpack"]},{"id":"neon","name":"夜のネオン","why":"線の書体を題字に、本文はすっきり角ゴ。暗い画面で効く","useFor":"夜のイベント・クラブ・ゲームの題字","trkUse":"EDM・夜の曲・サイバー系","tags":["ネオン","見出し","夜"],"scale":"1.333","display":{"family":"TrkRampart","weight":400,"tracking":0,"leading":1.1},"heading":{"family":"TrkRocknRoll","weight":400,"tracking":0.02,"leading":1.35},"body":{"family":"TrkZenKaku","weight":400,"tracking":0.02,"leading":1.8},"caption":{"family":"TrkZenKaku","weight":400,"tracking":0.06,"leading":1.5},"numeral":{"family":"TrkRampart","weight":400},"accent":{"family":"TrkRampart","weight":400},"packs":["rampart-one.stpack","rocknroll-one.stpack","zen-kaku.stpack"]},{"id":"denshi","name":"電子ゲーム","why":"ドットの書体を題字と数字に。本文と注記は角ゴにして読ませる","useFor":"レトロゲーム風・ドットの画面","trkUse":"チップチューン・8bit・レトロゲーム曲","tags":["ドット","レトロ","数字"],"scale":"1.25","display":{"family":"TrkDotGothic","weight":400,"tracking":0,"leading":1.1},"heading":{"family":"TrkDotGothic","weight":400,"tracking":0.02,"leading":1.35},"body":{"family":"TrkZenKaku","weight":400,"tracking":0.02,"leading":1.8},"caption":{"family":"TrkZenKaku","weight":400,"tracking":0.06,"leading":1.5},"numeral":{"family":"TrkDotGothic","weight":400},"accent":{"family":"TrkDotGothic","weight":400},"packs":["dotgothic.stpack","zen-kaku.stpack"]},{"id":"tegami","name":"手紙とエッセイ","why":"Klee の本文に、Yomogi の注記。紙の上の文章の感じ","useFor":"エッセイ・手紙・日記のような画面","trkUse":"アコースティック・しっとりした曲","tags":["手書き","本文","静か"],"scale":"1.25","display":{"family":"TrkKleeOne","weight":600,"tracking":0,"leading":1.1},"heading":{"family":"TrkKleeOne","weight":600,"tracking":0.02,"leading":1.35},"body":{"family":"TrkKleeOne","weight":400,"tracking":0.02,"leading":1.8},"caption":{"family":"TrkYomogi","weight":400,"tracking":0.06,"leading":1.5},"numeral":{"family":"TrkKleeOne","weight":400},"accent":{"family":"TrkNewTegomin","weight":400},"packs":["klee-one.stpack","new-tegomin.stpack","yomogi.stpack"]},{"id":"monogatari","name":"昔話と怪談","why":"毛筆の題字に、重みのある明朝。読み聞かせのように","useFor":"読み聞かせ・怪談・和風の読み物","trkUse":"和風ホラー・民謡・語りもの","tags":["和風","毛筆","読み物"],"scale":"1.333","display":{"family":"TrkYujiSyuku","weight":400,"tracking":0,"leading":1.1},"heading":{"family":"TrkZenOldMincho","weight":700,"tracking":0.02,"leading":1.35},"body":{"family":"TrkKaiseiTokumin","weight":400,"tracking":0.02,"leading":1.8},"caption":{"family":"TrkKaiseiTokumin","weight":400,"tracking":0.06,"leading":1.5},"numeral":{"family":"TrkKaiseiTokumin","weight":500},"accent":{"family":"TrkZenKurenaido","weight":400},"packs":["kaisei-tokumin.stpack","yuji-syuku.stpack","zen-kurenaido.stpack","zen-old-mincho.stpack"]},{"id":"tetsudo","name":"駅と鉄道","why":"駅名標の極太を題字に。数字も同じ書体で揃える","useFor":"旅・路線・時刻表のような画面","trkUse":"鉄道もの・旅の曲・行進曲","tags":["見出し","元気","旅"],"scale":"1.25","display":{"family":"TrkTrainOne","weight":400,"tracking":0,"leading":1.1},"heading":{"family":"TrkZenKaku","weight":700,"tracking":0.02,"leading":1.35},"body":{"family":"TrkZenKaku","weight":400,"tracking":0.02,"leading":1.8},"caption":{"family":"TrkStick","weight":400,"tracking":0.06,"leading":1.5},"numeral":{"family":"TrkTrainOne","weight":400},"accent":{"family":"TrkStick","weight":400},"packs":["stick.stpack","train-one.stpack","zen-kaku.stpack"]},{"id":"kottou","name":"古道具と活字","why":"古い活字の題字に、アンティーク体の本文。活版の紙面のように静かに","useFor":"アンティーク・古本・記録のような画面","trkUse":"アンティーク・昭和の曲・落ち着いた曲","tags":["レトロ","和風","余白"],"scale":"1.333","display":{"family":"TrkZenAntique","weight":400,"tracking":0,"leading":1.1},"heading":{"family":"TrkZenOldMincho","weight":700,"tracking":0.02,"leading":1.35},"body":{"family":"TrkShipporiAntique","weight":400,"tracking":0.02,"leading":1.8},"caption":{"family":"TrkZenAntique","weight":400,"tracking":0.06,"leading":1.5},"numeral":{"family":"TrkZenAntique","weight":400},"accent":{"family":"TrkYuseiMagic","weight":400},"packs":["shippori-antique.stpack","yusei-magic.stpack","zen-antique.stpack","zen-old-mincho.stpack"]},{"id":"zasshi","name":"雑誌の飾り","why":"飾り明朝の題字に、ひな明朝の見出し。紙の雑誌の感じ","useFor":"読み物・コラム・特集の見出し","trkUse":"ポップス・特集もののスキン","tags":["かわいい","明朝","読み物"],"scale":"1.333","display":{"family":"TrkKaiseiDecol","weight":700,"tracking":0,"leading":1.1},"heading":{"family":"TrkHinaMincho","weight":400,"tracking":0.02,"leading":1.35},"body":{"family":"TrkShipporiMincho","weight":400,"tracking":0.02,"leading":1.8},"caption":{"family":"TrkShipporiMincho","weight":400,"tracking":0.06,"leading":1.5},"numeral":{"family":"TrkKaiseiDecol","weight":400},"accent":{"family":"TrkHachiMaru","weight":400},"packs":["hachi-maru-pop.stpack","hina-mincho.stpack","kaisei-decol.stpack","shippori-mincho.stpack"]},{"id":"shizuka","name":"しずかな読み物","why":"古い活字風のアンティーク体を題字に、Noto Serif の本文。長く読むための組み合わせ","useFor":"長文・記録・落ち着いた読み物","trkUse":"長い曲・静かな曲・読ませる画面","tags":["読みやすい","明朝","本文"],"scale":"1.25","display":{"family":"TrkShipporiAntique","weight":400,"tracking":0,"leading":1.1},"heading":{"family":"TrkKaiseiTokumin","weight":500,"tracking":0.02,"leading":1.35},"body":{"family":"TrkNotoSerifJP","weight":400,"tracking":0.02,"leading":1.8},"caption":{"family":"TrkNotoSerifJP","weight":400,"tracking":0.06,"leading":1.5},"numeral":{"family":"TrkNotoSerifJP","weight":400},"accent":{"family":"TrkZenKaku","weight":700},"packs":["kaisei-tokumin.stpack","noto-serif-jp.stpack","shippori-antique.stpack","zen-kaku.stpack"]}];
  const SCALES = ["1.125", "1.2", "1.25", "1.333", "1.5"];
  const BASE = 16;
  const FORMAT = "trk-typography", VERSION = 1;
  const SLOTS = ["display", "heading", "body", "caption", "numeral", "accent"];
  /* 描き方の段階。契約（`trk-typography` v1）が認めるのもこの4つだけなので、
     役の名前（display など）をここに通す必要はありません（trk253・レビュー C-2 の指摘） */
  const PRESETS = ["one", "pair", "roles", "digits"];
  const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
  /* 書体名は CSS にそのまま書くので、文字種を絞る（`"` や `;` を入れない） */
  const FAMILY_RE = /^[A-Za-z0-9][A-Za-z0-9 _.-]{0,39}$/;
  const byId = id => PAIRINGS.find(p => p.id === id) || null;
  const familyOf = v => (typeof v === "string" && FAMILY_RE.test(v.trim()) ? v.trim() : "");
  const weightOf = v => (WEIGHTS.includes(Number(v)) ? Number(v) : 400);
  const numOf = (v, lo, hi, def) => (typeof v === "number" && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def);

  /* 1スロット分を、知らない項目を落として作り直す。書体名が無ければ null（＝その役は使わない） */
  function sanitizeSlot(v) {
    if (!v || typeof v !== "object") return null;
    const family = familyOf(v.family);
    if (!family) return null;
    const out = { family, weight: weightOf(v.weight) };
    const tracking = numOf(v.tracking, -0.02, 0.08, NaN);
    const leading = numOf(v.leading, 0.9, 2, NaN);
    if (isFinite(tracking)) out.tracking = Math.round(tracking * 1000) / 1000;
    if (isFinite(leading)) out.leading = Math.round(leading * 100) / 100;
    return out;
  }

  /* 保存値の掃除。**何も分かりません（unknown pairing・old 版・壊れた値）→ null ＝「使わない」**。
     未知の項目はここから先へコピーしないので、新しい版が足した項目を古い版が読んでも消えるだけ。 */
  function sanitize(v) {
    if (!v || typeof v !== "object") return null;
    const preset = PRESETS.includes(v.preset) ? v.preset : "pair";
    const pairing = byId(v.pairing);
    if (!pairing) return null;
    const src = v.slots && typeof v.slots === "object" ? v.slots : {};
    const slots = {};
    for (const key of SLOTS) {
      const mine = sanitizeSlot(src[key]) || sanitizeSlot(pairing[key]);
      if (mine) slots[key] = mine;
    }
    if (!slots.display && !slots.body) return null;
    return {
      format: FORMAT, version: VERSION, pairing: pairing.id, preset,
      base: numOf(v.base, 8, 40, BASE),
      scale: SCALES.includes(v.scale) ? v.scale : (SCALES.includes(pairing.scale) ? pairing.scale : "1.25"),
      slots
    };
  }

  /* CSS 変数の中身を作る。`extra` を渡すと、その役が無くても本文の名前を後から足せる（test 用） */
  function cssVars(typo) {
    const fallback = "var(--font)";
    if (!typo || !typo.slots) return { display: "", body: "" };
    const name = key => {
      const s = typo.slots[key];
      return s ? '"' + s.family + '"' : "";
    };
    const stack = primary => (primary ? primary + "," + fallback : "");
    const out = { display: stack(name("display") || name("heading")), body: stack(name("body") || name("caption")) };
    /* 🎨 trk299：見出し用の枠（heading）は、見出し（summary・.panel h3）にだけ使う。無ければ入れない */
    if (name("heading")) out.heading = stack(name("heading"));
    return out;
  }

  /* 効かせる場所：`.brand h1`・`details.panel > summary`・`.panel h3`（css/style.css 側）。
     on のときだけ `body.trk-typo-on` を張るので、**選んでいない端末の見た目は1ピクセルも変わらない**。 */
  function apply(typo) {
    const value = typo === undefined ? (window.Trk && window.Trk.core ? window.Trk.core.settings.typography : null) : typo;
    const body = document.body, root = document.documentElement;
    if (!body || !root) return null;
    const clean = sanitize(value);
    const vars = cssVars(clean);
    if (!clean || (!vars.display && !vars.body)) {
      body.classList.remove("trk-typo-on");
      body.classList.remove("trk-typo-heading");
      root.style.removeProperty("--trk-typo-display"); root.style.removeProperty("--trk-typo-body");
      root.style.setProperty("--trk-typo-heading", "");
      return null;
    }
    if (vars.display) root.style.setProperty("--trk-typo-display", vars.display); else root.style.removeProperty("--trk-typo-display");
    if (vars.body) root.style.setProperty("--trk-typo-body", vars.body); else root.style.removeProperty("--trk-typo-body");
    /* 見出しの枠は、書体がある組のときだけ張る（無い組では見出しは従来どおり display のまま） */
    root.style.setProperty("--trk-typo-heading", vars.heading || "");
    if (vars.heading) body.classList.add("trk-typo-heading"); else body.classList.remove("trk-typo-heading");
    body.classList.add("trk-typo-on");
    return clean;
  }

  /* 選んだ書体がこの端末で使えるか（CSS の font-family は黙って次の名前に落ちるので、
     設定欄では「効いています」とは書きたくない）。`document.fonts` が無い環境は null＝判定しません。 */
  function available(typo) {
    const clean = typo && typo.slots ? typo : null;
    if (!clean) return null;
    const names = [];
    for (const key of ["display", "body"]) { const s = clean.slots[key]; if (s && s.family) names.push(s.family); }
    if (!names.length) return null;
    try {
      const fonts = document.fonts;
      if (!fonts || typeof fonts.check !== "function") return null;
      return names.every(name => !!fonts.check('12px "' + name + '"'));
    } catch (_) { return null; }
  }

  window.Trk = window.Trk || {};
  window.Trk.typography = {
    PAIRINGS, SCALES, BASE, SLOTS, PRESETS, byId, sanitize, sanitizeSlot, cssVars, apply, available,
    /* 設定欄の選択肢（14組＋「使わない」）。名前は相手の目録の日本語そのまま */
    options: () => [{ id: "", name: "" }].concat(PAIRINGS.map(p => ({ id: p.id, name: p.name, why: p.why })))
  };
})();
