# 模拟经营商场：建造报价与提交 / Authoritative construction

**Question:** how do a displayed quote, occupied cells and a cash balance stay consistent when the player confirms an old request?

这个案例来自《模拟经营商场》直营经营版本的建造链。模型只保留四个格子、整数现金、一种固定费用的设施和经营修订号；费用 30、初始现金 100 都是新写教学数值，不是原游戏配置。

## 原项目中观察到的边界

查阅位置：`game/application/retail_session.gd`、`game/core/retail_run.gd`、`game/core/retail_floor.gd`，以及功能 `017-mall-story-parity` 的规格和架构计划。这里不发布原项目的内容表、素材、原作研究记录或存档。

| 所有者 | 职责与公开入口 | 不应下放给谁 |
| --- | --- | --- |
| 接口 `RetailDesk` | 选址、焦点、确认与展示；消费应用快照 | 不在按钮里计算最终价格或扣钱 |
| 应用 `RetailSession` | 开局、当前局、命令与保存；`command(action, args, revision, …)`、`view()`、`save()` | 不复制核心建造规则 |
| 核心 `RetailRun` | 经营修订、资格与跨模块顺序；`command(action, args, expected_revision)` | 不由 UI 决定旧报价是否仍有效 |
| 核心 `RetailFloor` | 设施与占格，`quote`、`place` | 不持有账本或主动调用 UI |
| 核心 `RetailLedger` | 现金与交易记录、收支投影 | 不让每个面板维护第二份余额 |
| 数据配置与 `SaveStore` | 内容记录、存档形状、迁移及保存事务 | 不决定经营资格或定价 |
| 平台文件能力 | 文件读写与技术失败 | 不决定退款或建造结果 |

原流程在经营核心验证修订及当前状态，重新取得权威报价，再占格并记账。应用处理保存结果；保存失败和业务拒绝是不同边界，不能把失败提示理解成内存中已完成的交易自动撤销。

## 教学模型的设计

`demo.mjs`（接口）→ `RetailSession`（应用）→ `MallRun`（核心）→ `Floor` / `Ledger`（同层单向依赖）。`Floor` 和 `Ledger` 不互相调用，也不回调协调者。`MallRun` 的价格规则与修订只存在于核心，应用只管理会话入口。

模型用不可变候选对象准备下一份占格与账本，再同步替换两个引用。真实项目使用既有同步提交实现；候选对象方式是这里为说明提交边界所做的简化，并非原项目逐行翻译。

| 状态 | 唯一所有者 | 生命周期 |
| --- | --- | --- |
| 当前经营局对象 | `RetailSession` | 一次会话 |
| 经营 `revision` | `MallRun` | 一局，每次成功建造加一 |
| 设施、占格与实例 ID | `Floor` | 当前局地图 |
| 整数现金 | `Ledger` | 当前局账本 |
| 显示的报价副本 | 接口 | 当前确认操作，不是权威价格 |

模型契约：

```text
quote(column: integer) -> {ok, column, price, revision} | {ok: false, error, revision}
command('build', {column, revision}) -> {ok, price, revision} | {ok: false, error}
view() -> {revision, shops: [{id, column}], cash}
```

column 为 0–3；price/cash 是整数教学货币单位；revision 是非负整数版本。错误包括 `stale_revision`、`invalid_cell`、`occupied`、`insufficient_cash` 和 `unknown_command`。调用方传入的 `price` 被忽略，核心在提交时重算报价。所有返回对象都是独立数据，查询不提交变化。

## 一条完整流程

1. 玩家选择 0 号格，接口调用应用查询；核心给出 30 的费用与版本 0。
2. 界面显示这个结果，不另算一份扣款公式。
3. 玩家确认，接口只需提交目标格与版本。核心重验版本、占格与资金。
4. 核心准备候选地图与候选账本；两者就绪后提交，版本加一。
5. 接口重新读取快照，显示设施和 70 现金。重复提交版本 0 被拒绝，不再扣款。

若另一笔建造先完成，即便原目标格仍空，旧版本也拒绝并要求重新报价。余额不足、越界、已有设施的请求均保持整个状态不变。单线程同步流程中没有 await、外部 I/O 或回调插入提交；这个版本校验不是网络幂等键，也不代表跨进程并发控制。

完整游戏另有经营推进、建造时长、保存与恢复。模型不实现磁盘事务；若加入持久化，应明确内存提交与文件提交的顺序、失败后的已提交部分和重试语义，再决定所需的事务或操作 ID，不能把本模型推广成分布式事务方案。

## 验证

```sh
node examples/mall/demo.mjs
node --test examples/mall/behavior.test.mjs
```

测试覆盖报价只读、权威价格、成功扣款、重复提交、其他建造导致报价过期、余额不足、恰好够钱、占格/越界拒绝及快照隔离。没有验证原游戏的自然营业、完整存档、磁盘中断、界面或并发服务器。

**变化检验：** 新增设施价格规则应进入核心并从合法的数据配置读取，UI 继续展示报价；新增保存后端只改变数据/平台边界；增加跨进程多人经营则超出了同步提交假设，必须先重新设计事务与重试契约。
