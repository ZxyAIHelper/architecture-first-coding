# 先设计架构，再处理代码

[English](README.md) · [完整 Skill](skills/architecture-first-coding/SKILL.md) · [两个案例](examples/README.md)

一个适用于游戏开发及其他软件开发的 coding agent skill。先把职责、权威状态所有者、具体接口、生命周期和依赖方向讲清楚，再实现并对照真实调用验收。

这套规则在《土豆兄弟》和《模拟经营商场》两个 Godot 项目的开发中持续使用。这里保留全局 skill 原文，并将两款游戏中的典型决定提炼成独立的教学案例。示例使用重新编写的 JavaScript 模型，方便无需安装引擎就能运行；它们不等同于原游戏源码或完整功能。

## 核心约束

- 状态与规则各有唯一权威所有者，UI 负责输入与展示；查询不泄漏可写内部引用。
- 默认按接口 → 应用 → 核心 → 数据 → 平台五层职责设计，禁止低层依赖或主动调用上层。
- 同时审查源码与运行时调用，不能用回调、事件总线或服务定位器隐藏反向依赖。
- 跨模块修改先明确命令、查询、字段、单位、错误与提交语义。
- 复用能力有明确归属；接入三方库前核对目标平台、版本及许可条件。
- 按改动规模执行，小修改不强制生成一套文档或五个空目录。

这里采用严格向下的分层，存储契约定义在数据层；它与“数据适配器实现领域层端口”的设计不同。现有项目有明确架构时先做职责映射，具体允许关系见[分层参考](skills/architecture-first-coding/references/layered-architecture.md)。

## 安装与使用

先克隆仓库，只将 `skills/architecture-first-coding` 复制到个人 skills 目录。已有同名 skill 时先备份本地修改。Windows PowerShell：

```powershell
git clone https://github.com/ZxyAIHelper/architecture-first-coding.git
$skillRoot = if ($env:CODEX_HOME) { Join-Path $env:CODEX_HOME 'skills' } else { Join-Path $env:USERPROFILE '.codex/skills' }
New-Item -ItemType Directory -Path $skillRoot -Force | Out-Null
Copy-Item -LiteralPath './architecture-first-coding/skills/architecture-first-coding' -Destination $skillRoot -Recurse
```

macOS / Linux 命令见[英文说明](README.md#install-in-codex)。其他支持 `SKILL.md` 的代理可按其安装机制使用。

调用示例：

```text
使用 $architecture-first-coding 设计本波重新开始功能。
先明确阶段与战斗状态分别归谁、检查点捕获时机、恢复契约、
重复命令和表现反馈的处理，再在项目现有架构内实现。
```

```text
使用 $architecture-first-coding 评审商场建造流程。
追踪报价、确认、占格、扣款，检查过期报价、重复提交、
现金与设施状态的所有权，以及界面是否重复计算价格。
```

## 从两个游戏提炼的案例

| 案例 | 展示的决定 |
| --- | --- |
| [土豆兄弟：波次恢复](examples/survivor/README.md) | 会话管理阶段、检查点和重开次数；战斗核心持有战斗状态；恢复不重复发入场奖励，反馈按尝试次数区分 |
| [模拟经营商场：建造提交](examples/mall/README.md) | 地图管占格、账本管现金、经营核心协调提交；报价只读，确认重验版本、空间和资金 |

每个案例都有职责与状态表、契约、完整流程、失败处理和行为测试。为便于运行，模型只实现接口、应用及核心的必要职责，没有 I/O 时不制造数据层和平台层空壳。原游戏中的数据与平台边界在案例文档中另行解释。

使用 Node.js 22+，无需安装 npm 包：

```sh
node examples/survivor/demo.mjs
node examples/mall/demo.mjs
node scripts/verify.mjs
```

检查覆盖发布包完整性、链接、常见泄漏模式和两个模型的关键行为；不代表完整游戏回归，也不代表已重新验证 skill 在不同代理中的行为。原版 skill 的五份文件保持不变。

本仓库的 skill、说明和新写示例采用 [MIT 许可证](LICENSE)。游戏素材、完整源码及第三方内容未包含在此次发布中。
