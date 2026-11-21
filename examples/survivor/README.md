# 土豆兄弟：本波重新开始 / Wave checkpoints

**Question:** who should restore a failed wave when battle state, session time and visual feedback have different lifetimes?

这个案例来自《土豆兄弟》项目对本波重开功能的分工。公开模型只保留一个波次、一个玩家、入场收入和可重复的随机序列；不含真实战斗、20 波流程、成就、存档或游戏资源。

## 原项目中观察到的边界

查阅位置：`game/application/run/run_session.gd`、`game/application/battle/battle_loop.gd`，以及功能 `001-survivor-core-loop` 的规格、计划和任务。这里的路径用于说明来源，不要求读者持有原仓库。

| 责任 | 原项目所有者与契约 | 为什么这样分 |
| --- | --- | --- |
| 会话阶段与重开次数 | 应用 `RunSession`；`execute(name, data)`、`phase_snapshot()` | 死亡后允许什么操作属于流程，不属于 HUD |
| 波次运行状态的捕获和恢复 | 应用战斗边界 `BattleLoop.capture_wave_checkpoint()`、`restore_wave_checkpoint()`，协调各核心所有者 | 会话不逐字段修改敌人、装备、战斗数值 |
| 会话时钟、输入与事实回退 | 会话在波次开场保存，并在恢复时还原 | 只恢复血量会留下已经提交的本次尝试记录 |
| 成就证据 | 专属成就事实组件按开场捕获/恢复 | 失败尝试不能混入成功尝试的证据 |
| 表现身份与清理 | 会话返回恢复标记和重开次数；界面更新表现 | 时间和实体标识可能重用，需要区分不同尝试 |

开场检查点在入场处理和收入完成后捕获。恢复不会重新执行入场；重开次数保留在检查点外。完成波次与同一局的身份有各自生命周期，不能用重开当前波替换整局对象。

在完整项目中，核心持有领域状态，数据层负责资料记录/格式，平台层负责文件、时钟和运行环境。发布模型不做 I/O，只展示必要职责。

## 运行模型的职责与契约

`demo.mjs`（接口）→ `RunSession`（应用）→ `Battle`（核心）。`Battle` 不持有会话或回调。文件划分按实际职责，没有空的数据/平台模块。

| 所有者 | 状态 | 生命周期 |
| --- | --- | --- |
| `RunSession` | `phase`、开场检查点、`restartCount` | 一局；结束失败时释放检查点 |
| `Battle` | `wave`、`health`、`coins`、`tick`、`random` | 当前战斗；恢复为同一次开场 |
| 接口 | 输出文本 | 不持有权威领域状态 |

模型接口是教学 API，与原项目方法不完全相同：

```text
execute('start') -> {ok}                         // 只允许 menu
execute('step', {damage, earned}) -> {ok, dead}   // 只允许 combat
execute('restart_wave') -> {ok, rewound, feedbackReset}
execute('finish_defeat') -> {ok}                 // 只允许 wave_defeat
view() -> {phase, restartCount, battle: {wave, health, coins, tick, random}}
```

`damage` 和 `earned` 是非负安全整数；health/coins 是教学模型的整数点数，tick 每步加一，没有墙上时间单位。未定义或错误阶段的命令返回 `invalid_phase_or_command`；非法步输入返回 `invalid_input`，都不提交变化。查询返回深复制，不提供业务写入口。

## 一条完整流程

1. 玩家开始：应用请求核心入场，得到 5 点教学收入，然后捕获检查点。
2. 战斗推进改变血量、金币、tick 和随机状态。核心返回 `dead` 事实，应用决定进入 `wave_defeat`。
3. 玩家重开：应用请求核心恢复自己持有的检查点，恢复阶段并递增重开次数。
4. 界面看到 `feedbackReset` 后清理旧表现，用 `(restartCount, tick)` 区分尝试。模型没有渲染器，实际表现清理只在文档解释。
5. 重复点击重开时已处于 combat，拒绝第二次操作；再次失败后可合法重开，次数继续增加。

检查点只来自当前会话，恢复是同步内存操作；不是不可信存档解析协议。完整游戏还要覆盖各子系统恢复失败、事实截断和音效/动画重用；这些不由本模型测试证明。

## 验证

```sh
node examples/survivor/demo.mjs
node --test examples/survivor/behavior.test.mjs
```

测试覆盖开场收入不重复、血量/金币/时钟/随机状态恢复、重复与错误阶段拒绝、两次合法重开、查询隔离、非法输入和失败结束后的生命周期。它们不能证明原游戏全部检查点字段齐全，也不验证图形、音效或实际性能。

**变化检验：** 新增一种需要回退的战斗状态，应先明确其核心所有者，再纳入战斗检查点；新增展示动画只改接口表现；重开次数应继续留在应用层，避免跟随核心检查点回退。
