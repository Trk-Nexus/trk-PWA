// SPDX-License-Identifier: GPL-3.0-or-later
/* 📚 trk326（R-SKIN-1）：差し戻し（holdback）の**単一定義**。

   これまで `tools/import-skin-catalog.mjs`（書き出す側）と `tools/check-skin-contrast.mjs`（検める側）に
   別々の一覧があり、片方だけ直すと「検査は通るが、生成物と食い違う」状態になりました（Avatar 倉庫の指摘）。
   ここに 1 つだけ置き、両方がここを読みます。

   種類を分けています（要項 R-SKIN-1）：
     intentional-low … 意図して読みづらくした配色（利用者に理由を見せて選ばせる。合格証ではない）
     pending         … 目録側の調整待ち（いまは差し戻しのまま。直れば外す）

   `js/skins-volennes…` の生成物（`D.SKIN_HOLDBACK`）はこの一覧から作られます。
   **r10 の固定物（catalog/・release/・skin-volumes/）は触りません。** */

export const HOLDBACK_KINDS = Object.freeze(["intentional-low", "pending"]);

export const SKIN_HOLDBACK = Object.freeze({
  "house-edge": Object.freeze({
    kind: "intentional-low",
    reason: "暗い面に暗い文字を重ねる意図的な低コントラスト（理由は目録の readabilityReason）。棚のカードに理由を出す"
  }),
  "gold-chip": Object.freeze({
    kind: "pending",
    reason: "金色の面と金の文字が近く、面の色差の上限を超える（目録側の調整待ち）"
  }),
  "orichalcum": Object.freeze({
    kind: "pending",
    reason: "山吹色の面と文字の差が足りない（目録側の調整待ち）"
  })
});

/** 差し戻しの ID（並びは gen の出力と合わせて辞書順） */
export const holdbackIds = () => Object.keys(SKIN_HOLDBACK).sort();

/** 1 つの ID の情報（無ければ null） */
export const holdbackOf = id => (Object.prototype.hasOwnProperty.call(SKIN_HOLDBACK, id) ? SKIN_HOLDBACK[id] : null);

/** 種類ごとの ID */
export const holdbackByKind = kind => holdbackIds().filter(id => SKIN_HOLDBACK[id].kind === kind);

/** 画面・ログに出す 1 行（種類を見分けられる形） */
export function holdbackSummary() {
  return HOLDBACK_KINDS.map(kind => {
    const ids = holdbackByKind(kind);
    return `${kind}：${ids.length} 種${ids.length ? `（${ids.join(", ")}）` : ""}`;
  }).join(" ／ ");
}

/** 差し戻しの ID が、定義に無い・定義にあるのに生成物に無い、を比べる（道具の取り違えを見つける） */
export function diffHoldback(generatedIds) {
  const gen = new Set(Array.isArray(generatedIds) ? generatedIds : []);
  const declared = new Set(holdbackIds());
  return {
    missingInGenerated: [...declared].filter(id => !gen.has(id)),
    unknownInGenerated: [...gen].filter(id => !declared.has(id))
  };
}
