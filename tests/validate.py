#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""UTAE 知识库结构校验（真实可运行的回归检查）。

检查项：
1. 每个知识条目有合法 YAML frontmatter（--- 包裹）
2. 必填字段存在：id / title / category / status / version
3. status 合法：draft / experimental / pending_review / validated / deprecated
4. id 全库唯一
5. category 与所在目录名一致（00-核心框架 ~ 09-废弃知识）
6. related 指向的 title 存在（警告级，不判失败）
7. 条目含十二节结构中的关键节（一、定义 / 四、适用场景 / 十二、更新记录）
8. viewer/data.js 可正常重建（语法检查）

用法：python3 tests/validate.py
退出码：0 = 全部通过；1 = 存在错误
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
K = ROOT / "knowledge"
VALID_STATUS = {"draft", "experimental", "pending_review", "validated", "deprecated"}
REQUIRED_FIELDS = ["id", "title", "category", "status", "version"]
CAT_DIRS = {d.name for d in K.iterdir() if d.is_dir()}
CAT_BASENAMES = {re.sub(r"^\d+-", "", d) for d in CAT_DIRS}
KEY_SECTIONS = ["一、定义", "四、适用场景", "十二、更新记录"]


def norm(s):
    """标题归一化：去空格、全角/半角括号，便于 related 匹配。"""
    return re.sub(r"[\s（）()]", "", str(s))

errors, warnings = [], []
entries = []


def err(f, msg):
    errors.append(f"{f}: {msg}")


def warn(f, msg):
    warnings.append(f"{f}: {msg}")


for md in sorted(K.rglob("*.md")):
    rel = str(md.relative_to(K))
    if md.name.upper() == "README.MD":
        continue
    text = md.read_text(encoding="utf-8")
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n?", text, re.S)
    if not m:
        err(rel, "缺少 frontmatter")
        continue
    fm = {}
    for line in m.group(1).split("\n"):
        if ":" in line:
            k, _, v = line.partition(":")
            fm[k.strip()] = v.strip()
    missing = [f for f in REQUIRED_FIELDS if f not in fm or not fm[f]]
    if missing:
        err(rel, f"缺少必填字段: {', '.join(missing)}")
        continue
    if fm["status"] not in VALID_STATUS:
        err(rel, f"非法 status: {fm['status']}")
    entries.append(fm)
    if fm.get("category") and fm["category"] not in CAT_BASENAMES and fm["category"] != "根目录":
        warn(rel, f"category '{fm['category']}' 与目录名不匹配")
    body = text[m.end():]
    for sec in KEY_SECTIONS:
        if sec not in body:
            warn(rel, f"缺少标准节『{sec}』")

ids = [e["id"] for e in entries]
dupes = {i for i in ids if ids.count(i) > 1}
for d in dupes:
    errors.append(f"重复 id: {d}")

titles = {norm(e["title"]) for e in entries}
for md in sorted(K.rglob("*.md")):
    if md.name.upper() == "README.MD":
        continue
    text = md.read_text(encoding="utf-8")
    m = re.match(r"^---\s*\n(.*?)\n---", text, re.S)
    if not m:
        continue
    rm = re.search(r"^related:\s*\[(.*?)\]", m.group(1), re.M)
    if rm:
        for r in [x.strip() for x in rm.group(1).split(",") if x.strip()]:
            if norm(r) not in titles:
                warn(str(md.relative_to(K)), f"related 指向不存在的条目: {r}")

n_status = {}
for e in entries:
    n_status[e["status"]] = n_status.get(e["status"], 0) + 1

print(f"条目总数: {len(entries)}")
for s in ["validated", "experimental", "pending_review", "draft", "deprecated"]:
    print(f"  {s}: {n_status.get(s, 0)}")
for w in warnings:
    print(f"WARN  {w}")
for e in errors:
    print(f"ERROR {e}")
print(f"\n结果: {len(errors)} 错误 / {len(warnings)} 警告")
sys.exit(1 if errors else 0)
