# 发布方案

## 边界与归属

- `skills/architecture-first-coding/`：原版 skill 和 references 的发布副本，保持规则不变。
- `.gitattributes`：原版 skill 禁用文本转换，确保 Windows 全局源文件与 Git 发布对象字节一致；其余文本统一 LF。
- `README.md`、`README.zh-CN.md`、`LICENSE`：仓库级介绍、安装与授权。
- `examples/survivor/`：从《土豆兄弟》提炼的教学模型。接口脚本提交命令；应用拥有阶段与重开次数；核心拥有战斗状态和检查点映射。恢复不重复入场奖励，低层仅返回数据。
- `examples/mall/`：从《模拟经营商场》提炼的教学模型。接口提交请求；应用管理会话；核心拥有经营版本及协调地图、账本；地图拥有占格，账本拥有现金。同步内存提交前完成校验，避免部分扣款。
- 模型仅使用 JavaScript 标准能力，无引擎或三方运行依赖；没有 I/O 的模型不创建数据/平台空壳。
- `scripts/verify.mjs` 与 CI：只负责发布包完整性、引用、泄漏检查及调用行为测试，不承担游戏业务规则。

## 流程与失败

先复制全局 skill，再重写两个公开案例与模型并验证。只在验证完成后创建 public 仓库、提交和推送。GitHub 认证仅从本机凭据管理器读取，不写入仓库、脚本或日志。若同名仓库存在，先核查归属与内容，避免覆盖。网络失败可在确认远端状态后重试；不强推。

验证包括文件哈希比对、Markdown 本地链接、发布文件敏感内容检查、模型行为测试和远端 public / HEAD 检查。没有对原版 skill 做行为修改；本次不宣称重新验证其在任意代理中的决策效果，也不执行两个完整游戏的回归。

CI 使用 GitHub 托管 Ubuntu 24.04 与 Node.js 22；本地使用 Node.js 24。仅 CI 引用官方 `actions/checkout`、`actions/setup-node` v6，按官方仓库说明及远端标签核验后锁定提交。两者为 MIT，代码及传递依赖不复制进本发布包，也不进入游戏运行时；官方源码与许可证分别见 https://github.com/actions/checkout 与 https://github.com/actions/setup-node 。自托管 runner 不在此次支持范围。
