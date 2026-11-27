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
     `heading`（見出し）は trk299 から見出し（summary・`.panel h3`）に使う。`caption`・`numeral`・`accent` は**保存できる形にしてあるが、まだ使いません**
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
  /* 🔤 trk326（R-TYP-1）：倉庫の組み合わせ単体 JSON（`trk-typography-pairing` v1）を受け取る。
     取り込んだ組は `pairing: "custom"` として settings.typography に**そのまま**残す（保存キーは増やさない）。 */
  const PAIRING_FORMAT = "trk-typography-pairing";
  const CUSTOM = "custom";
  const PAIRING_MAX_BYTES = 64 * 1024;
  const SLOTS = ["display", "heading", "body", "caption", "numeral", "accent"];
  /* 見出しの枠を効かせるか。作品の見出し（DotGothic 等）を当てる処理が入るまで false（trk301） */
  const HEADING_FROM_WORK = false;
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
    /* 🔤 trk326：どのパックを入れればよいかの手掛かり（載っているときだけ・安全な名前だけ） */
    const pack = typeof v.pack === "string" ? v.pack.split("/").pop() : "";
    if (/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}\.stpack$/.test(pack)) out.pack = pack;
    const tracking = numOf(v.tracking, -0.02, 0.08, NaN);
    const leading = numOf(v.leading, 0.9, 2, NaN);
    if (isFinite(tracking)) out.tracking = Math.round(tracking * 1000) / 1000;
    if (isFinite(leading)) out.leading = Math.round(leading * 100) / 100;
    return out;
  }

  /* 🔤 trk326：取り込んだ組（custom）の検証。書体名は Trk* だけ・パック名は安全な形だけ */
  const PACK_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}\.stpack$/;
  function sanitizeCustom(v) {
    if (!v || typeof v !== "object") return null;
    const id = typeof v.id === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,43}$/.test(v.id) ? v.id : "";
    if (!id) return null;
    const name = typeof v.name === "string" && v.name.trim() ? v.name.trim().slice(0, 80) : id;
    const packs = Array.isArray(v.packs) ? v.packs.filter(x => typeof x === "string" && PACK_RE.test(x)).slice(0, 12) : [];
    const slots = {};
    const src = v.slots && typeof v.slots === "object" ? v.slots : {};
    for (const key of SLOTS) {
      const one = src[key];
      if (!one || typeof one !== "object") continue;
      const family = typeof one.family === "string" && /^Trk[A-Za-z0-9]{1,36}$/.test(one.family) ? one.family : "";
      if (!family) continue;
      slots[key] = sanitizeSlot({ family, weight: one.weight, tracking: one.tracking, leading: one.leading, pack: one.pack });
    }
    if (!slots.display && !slots.body) return null;
    return { id, name, scale: SCALES.includes(v.scale) ? v.scale : "1.25", trkUse: typeof v.trkUse === "string" ? v.trkUse.slice(0, 120) : "", packs, slots };
  }

  /* 保存値の掃除。**何も分かりません（unknown pairing・old 版・壊れた値）→ null ＝「使わない」**。
     未知の項目はここから先へコピーしないので、新しい版が足した項目を古い版が読んでも消えるだけ。 */
  function sanitize(v) {
    if (!v || typeof v !== "object") return null;
    const preset = PRESETS.includes(v.preset) ? v.preset : "pair";
    const custom = v.pairing === CUSTOM ? sanitizeCustom(v.custom) : null;
    const pairing = byId(v.pairing) || custom;
    if (!pairing) return null;
    const src = v.slots && typeof v.slots === "object" ? v.slots : {};
    const slots = {};
    for (const key of SLOTS) {
      /* 取り込んだ組は slots の中、目録の組は組の直下に役を持つ */
      const mine = sanitizeSlot(src[key]) || sanitizeSlot((pairing.slots || pairing)[key]);
      if (mine) slots[key] = mine;
    }
    if (!slots.display && !slots.body) return null;
    const outValue = {
      format: FORMAT, version: VERSION, pairing: custom ? CUSTOM : pairing.id, preset,
      base: numOf(v.base, 8, 40, BASE),
      scale: SCALES.includes(v.scale) ? v.scale : (SCALES.includes(pairing.scale) ? pairing.scale : "1.25"),
      slots
    };
    /* 取り込んだ組は、名前とパックの一覧も保存に残す（次に開いたとき「どの組か」「何を入れればよいか」を出せる） */
    if (custom) outValue.custom = custom;
    return outValue;
  }

  /* 🔤 trk326（R-TYP-1）：組み合わせ単体 JSON を、保存できる形へ。理由：format（書式・版）／slots（役が無い）／"" */
  function pairingFromJson(raw) {
    let v = raw;
    if (typeof v === "string") { try { v = JSON.parse(v); } catch (_) { return { ok: false, reason: "parse", value: null }; } }
    if (!v || typeof v !== "object" || v.format !== PAIRING_FORMAT || v.version !== 1) return { ok: false, reason: "format", value: null };
    /* 倉庫の検証（js/library-receiver.js）があれば、先に同じ目で見る（許可された Trk* 書体・安全なパス） */
    const LR = window.Trk && window.Trk.libraryReceiver;
    let src = v;
    if (LR && typeof LR.validateTypographyPairing === "function") {
      const checked = LR.validateTypographyPairing(v);
      if (!checked.ok) return { ok: false, reason: "slots", value: null, errors: checked.errors };
      src = checked.pairing;
    }
    const declared = Array.isArray(src.requiredPacks) ? src.requiredPacks : (Array.isArray(src.packs) ? src.packs : []);
    /* パック名は「…/名前.stpack」か「名前.stpack」の形だけ。形の違うものが混ざっていたら読まない（黙って捨てない） */
    const packs = [];
    for (const one of declared) {
      if (typeof one !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._\/-]{0,127}$/.test(one) || !/\.stpack$/.test(one) || one.includes("..")) return { ok: false, reason: "slots", value: null };
      const base = one.split("/").pop();
      if (!packs.includes(base)) packs.push(base);
    }
    /* 役の書体名も、書いてあるものが違えば読まない（黙って落として別の組として扱わない） */
    const slotSrc = src.slots && typeof src.slots === "object" ? src.slots : {};
    for (const key of SLOTS) {
      const one = slotSrc[key];
      if (one === undefined) continue;
      if (!one || typeof one !== "object") return { ok: false, reason: "slots", value: null };
      if (one.family !== undefined && !(typeof one.family === "string" && /^Trk[A-Za-z0-9]{1,36}$/.test(one.family))) return { ok: false, reason: "slots", value: null };
      if (one.pack !== undefined) {
        const pth = String(one.pack);
        if (!/^[A-Za-z0-9][A-Za-z0-9._\/-]{0,127}$/.test(pth) || !/\.stpack$/.test(pth) || pth.includes("..")) return { ok: false, reason: "slots", value: null };
      }
    }
    const value = sanitizeCustom({ id: src.id, name: src.name, scale: src.scale, trkUse: src.trkUse, packs, slots: src.slots });
    if (!value) return { ok: false, reason: "slots", value: null };
    return { ok: true, reason: "", value };
  }

  /* この端末で使えない書体の、入れるべき `.stpack` の名前（重複なし・最大 8 件）。判定できない環境は空 */
  function missingPacks(typo) {
    const clean = typo && typo.slots ? typo : null;
    if (!clean) return [];
    const fonts = document && document.fonts;
    if (!fonts || typeof fonts.check !== "function") return [];
    const names = [];
    for (const key of SLOTS) {
      const slot = clean.slots[key];
      if (!slot || !slot.family) continue;
      let ok = true;
      try { ok = !!fonts.check('12px "' + slot.family + '"'); } catch (_) { ok = true; }
      if (!ok && slot.pack && !names.includes(slot.pack)) names.push(slot.pack);
    }
    /* パック名が分からないときは、組の requiredPacks を「入れれば直る見込み」として出す */
    if (!names.length) {
      const custom = clean.custom;
      if (custom && Array.isArray(custom.packs) && custom.packs.length) {
        const hasAll = (() => {
          try { return Object.values(clean.slots).every(s => !s.family || fonts.check('12px "' + s.family + '"')); } catch (_) { return true; }
        })();
        if (!hasAll) return custom.packs.slice(0, 8);
      }
    }
    return names.slice(0, 8);
  }

  /* 取り込んで、すぐ使う（保存は settings.typography だけ）。戻り値：ok／reason／missing／name */
  function importPairing(raw) {
    const r = pairingFromJson(raw);
    if (!r.ok) return { ok: false, reason: r.reason, missing: [], name: "" };
    const core = window.Trk && window.Trk.core;
    const typo = sanitize({ pairing: CUSTOM, custom: r.value, preset: "pair" });
    if (!typo) return { ok: false, reason: "slots", missing: [], name: "" };
    if (core && core.settings) {
      const before = core.settings.typography;
      core.settings.typography = typo;
      apply(typo);
      if (typeof core.saveUserPrefs === "function" && core.saveUserPrefs() === false) {
        core.settings.typography = before;
        apply(before);
        return { ok: false, reason: "save", missing: [], name: r.value.name };
      }
    } else {
      apply(typo);
    }
    return { ok: true, reason: "", missing: missingPacks(typo), name: r.value.name, typography: typo };
  }

  /* ファイルから。上限 64 KiB（読む前に見る） */
  async function importPairingFile(file) {
    if (!file) return { ok: false, reason: "format", missing: [], name: "" };
    if (typeof file.size === "number" && file.size > PAIRING_MAX_BYTES) return { ok: false, reason: "size", missing: [], name: "" };
    let text = "";
    try { text = await file.text(); } catch (_) { return { ok: false, reason: "read", missing: [], name: "" }; }
    if (text.length > PAIRING_MAX_BYTES) return { ok: false, reason: "size", missing: [], name: "" };
    return importPairing(text);
  }

  /* いま選ばれている組の名前（取り込んだ組は保存から） */
  function nameOf(typo) {
    const clean = typo && typo.slots ? typo : null;
    if (!clean) return "";
    if (clean.pairing === CUSTOM) return (clean.custom && clean.custom.name) || CUSTOM;
    const p = byId(clean.pairing);
    return p ? p.name : clean.pairing;
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
    /* 🎨 trk301（レビュー R1）：作品の見出しを当てる処理が入るまで、組の見出しは使わない（見出しは従来どおり） */
    if (vars.heading && HEADING_FROM_WORK) body.classList.add("trk-typo-heading"); else body.classList.remove("trk-typo-heading");
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
    /* 🔤 trk326（R-TYP-1）：組み合わせ単体 JSON（trk-typography-pairing v1）の受け口 */
    PAIRING_FORMAT, CUSTOM, pairingFromJson, missingPacks, importPairing, importPairingFile, nameOf, sanitizeCustom,
    /* 設定欄の選択肢（14組＋「使わない」）。名前は相手の目録の日本語そのまま */
    options: () => [{ id: "", name: "" }].concat(PAIRINGS.map(p => ({ id: p.id, name: p.name, why: p.why })))
  };
})();
