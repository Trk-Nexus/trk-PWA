#!/usr/bin/env python3
"""i18n.js へ、4 言語ぶんのキーを辞書の末尾に足す小さな道具（作業用）。

使い方：python3 tools/tmp-i18n-add.py keys.json
  keys.json = { "ja": { "key": "value", ... }, "en": {...}, "zh": {...}, "ko": {...} }
既にあるキーは書き換えない（4 言語で数が合わなくなるため、先に消してから足す）。
"""
import json
import sys

path = "/home/user/trk-PWA/js/i18n.js"
s = open(path, encoding="utf-8").read()
data = json.load(open(sys.argv[1], encoding="utf-8"))

def js(v):
    return json.dumps(v, ensure_ascii=False)

for lang in ("ja", "en", "zh", "ko"):
    lines = data[lang]
    st = s.index("\n  " + lang + ": {\n")
    close = s.index("\n  },", st) if lang != "ko" else s.index("\n  }\n};", st)
    for key, value in lines.items():
        if ("\n    " + key + ":") in s[st:close]:
            raise SystemExit(f"already present: {lang} {key}")
    head = s[:close].rstrip()
    tail = s[close:]
    ins = "".join(",\n    " + k + ":" + js(v) for k, v in lines.items())
    s = head + ins + tail

open(path, "w", encoding="utf-8").write(s)
print("ok")
