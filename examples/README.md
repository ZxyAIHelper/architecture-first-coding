# 两个游戏中的架构决定 / Worked examples

These are newly authored, engine-independent teaching models derived from architectural patterns observed in two Godot projects on 2026-11-21. They do not distribute those projects or reproduce their complete mechanics.

- [土豆兄弟 / Wave survival](survivor/README.md): checkpoints, phase ownership, restart identity and query isolation.
- [模拟经营商场 / Mall management](mall/README.md): authoritative quotes, stale confirmations, placement/payment coordination and query isolation.

两个案例保留实际架构问题，删去引擎和内容依赖。模型中的 API、错误码、简化数值和文件布局是教学约定；原项目的具体接口另外列出，不把模型签名冒充项目实现。只读检查不等同于两个游戏的新一轮运行验收。

Read a case study, run its `demo.mjs`, then run `node scripts/verify.mjs` from the repository root. Public outputs are copied values. Lower layers return results; neither model dispatches a callback into its caller.
