# 09-废弃知识

已过时、被取代或验证失败的条目。**不删除**——保留失败轨迹，防止同类知识反复被提出。

## 条目格式

从原位置移入时，在 frontmatter 中追加：

```yaml
status: deprecated
deprecated_date: YYYY-MM-DD
deprecated_reason: 被取代 / 验证失败 / 不再适用
replaced_by: 新条目 id（如有）
```

## 规则

- Deprecated 条目默认禁止调用；如需引用，必须显式说明理由并提示用户
- 每季度审查一次本目录：确认真无保留价值的，可征得用户同意后物理删除
