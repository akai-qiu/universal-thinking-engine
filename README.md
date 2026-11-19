# Universal Thinking & Action Engine（通用思考与行动引擎）

一套以元方法论为核心的 AI Agent Skill：不是让 AI「懂多少方法」，而是让它「懂得选择、组合、调整方法」。面对任何问题，先理解问题本质，再选择适当的思维模型，制定可行方案，暴露风险，推动执行，并通过反馈持续进化。

## 核心特性

- **双维分流**：任务规模五维评分定级（S/M/L）× 问题类型路由，避免「每个任务都跑全套流程」或「凭感觉裸奔」
- **五层流水线**：认知理解 → 问题决策 → 系统执行 → 验证审查 → 反馈进化，带回路的流水线——哪一层出错回哪一层，同层回退 ≥2 次不收敛则升级为用户决策
- **内置知识库**：31 条已验证方法论条目，按 5 层组织（认知与思维 / 问题与决策 / 系统与执行 / 审查与验证 / 反馈与进化）
- **自我进化机制**：知识状态机 Draft → Experimental → Pending Review → Validated / Deprecated，晋级需过「五问」，审批权在用户
- **HTML 知识仪表盘**：可视化浏览全部知识条目

## 目录结构

```
├── SKILL.md              # 主定义文件（Agent 读取入口）
├── knowledge/            # 知识库（00 核心框架 + 01~05 五层 + 06~09 生命周期目录）
├── system/protocols/     # 五份运行协议（分流/方法选择/动态迭代/知识生命周期/能力边界）
├── evolution/            # 学习日志、改进提案、复盘记录、版本变更日志
├── memory/               # 个人偏好与项目状态（Agent 长期记忆载体）
├── scripts/build_viewer.py   # 仪表盘生成脚本
├── tests/validate.py     # 知识库结构校验
└── viewer/               # HTML 知识仪表盘
```

## 安装（WorkBuddy / CodeBuddy）

```bash
# 方式一：CLI 安装后复制到 WorkBuddy 用户级 skill 目录
npx --yes skills@latest add akai-qiu/universal-thinking-engine --global --yes
cp -r ~/.agents/skills/universal-thinking-engine ~/.workbuddy/skills/

# 方式二：直接 clone 复制
git clone https://github.com/akai-qiu/universal-thinking-engine.git
cp -r universal-thinking-engine ~/.workbuddy/skills/
```

安装后重启 / 新开会话即可生效。

## 使用

在支持 Agent Skills 的环境中，当你说「帮我分析一下」「这个方案怎么样」「怎么规划」「挑挑毛病」等涉及实质复杂度任务的话时，Agent 会自动触发本 skill。

- **S 级（≤1 分）**：直接做，禁止套用流程结构
- **M 级（2-5 分）**：压缩为四步——重述 → 路径权衡 → 快速红队 → 建议+信号
- **L 级（≥6 分）**：完整五层流水线，最终拍板权在用户

## 维护

```bash
# 改完知识库后重新生成仪表盘数据
python3 scripts/build_viewer.py

# 结构校验（frontmatter 与状态合法性）
python3 tests/validate.py
```

## 版本

- v1.2（2026-11）当前版本：知识库 31 条 + 五份运行协议 + 进化机制 + 仪表盘
