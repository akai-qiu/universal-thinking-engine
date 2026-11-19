#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Parse knowledge/memory/evolution markdown files into viewer/data.js.

Run from anywhere: python scripts/build_viewer.py
Outputs viewer/data.js which index.html loads via <script src="data.js">.
No external dependencies; stdlib only.
"""
import json
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def parse_frontmatter(text):
    """Return (meta_dict, body). Handles simple YAML subset: key: value, inline lists."""
    meta = {}
    body = text
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n?", text, re.S)
    if m:
        body = text[m.end():]
        for line in m.group(1).split("\n"):
            if ":" not in line:
                continue
            key, _, val = line.partition(":")
            key, val = key.strip(), val.strip()
            if val.startswith("[") and val.endswith("]"):
                items = [x.strip() for x in val[1:-1].split(",") if x.strip()]
                meta[key] = items
            else:
                meta[key] = val
    return meta, body.strip()


def load_dir(subdir, kind):
    """Load md files under ROOT/subdir (recursive). Skip README for knowledge listing."""
    entries = []
    base = ROOT / subdir
    if not base.exists():
        return entries
    for p in sorted(base.rglob("*.md")):
        rel = p.relative_to(base)
        text = p.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(text)
        rel_str = str(rel)
        # category: knowledge -> top-level dir name; others -> subdir
        if kind == "knowledge":
            parts = rel.parts
            category = parts[0] if len(parts) > 1 else "根目录"
            is_readme = parts[-1].lower() == "readme.md"
        else:
            category = subdir
            is_readme = rel_str.lower() == "readme.md"
        entry = {
            "kind": kind,
            "file": rel_str,
            "category": category,
            "is_readme": is_readme,
            "id": meta.get("id", p.stem),
            "title": meta.get("title", p.stem),
            "status": meta.get("status", ""),
            "version": meta.get("version", ""),
            "confidence": meta.get("confidence", ""),
            "tags": meta.get("tags", []),
            "related": meta.get("related", []),
            "date": meta.get("date", meta.get("submitted", "")),
            "content": body,
        }
        entries.append(entry)
    return entries


def main():
    knowledge = load_dir("knowledge", "knowledge")
    memory = load_dir("memory", "memory")
    evolution = load_dir("evolution", "evolution")
    data = {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "knowledge": knowledge,
        "memory": memory,
        "evolution": evolution,
    }
    out = ROOT / "viewer" / "data.js"
    out.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, ensure_ascii=False)
    out.write_text("window.KB_DATA = " + payload + ";\n", encoding="utf-8")
    n_valid = sum(1 for e in knowledge if e.get("status") == "validated")
    print(f"OK: {len(knowledge)} knowledge / {len(memory)} memory / {len(evolution)} evolution -> {out}")
    print(f"    validated: {n_valid}", file=sys.stderr)


if __name__ == "__main__":
    main()
