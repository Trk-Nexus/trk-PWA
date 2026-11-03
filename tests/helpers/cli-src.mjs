// SPDX-License-Identifier: GPL-3.0-or-later
/* ⌨ trk288：ターミナルの本文は js/cli-pure.js（純粋な計算）と js/cli.js（板・配線）に分かれた。
   文字列で見張るテストは、この 2 つをつないだ本文を読む（どちらに書かれても見つかるように）。 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./browser-data.mjs";

export const CLI_FILES = ["js/cli-pure.js", "js/cli.js"];
export function cliSource() {
  return CLI_FILES.map(rel => fs.readFileSync(path.join(ROOT, rel), "utf8")).join("\n");
}
