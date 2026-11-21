# Architecture First Coding

[中文说明](README.zh-CN.md) · [Skill](skills/architecture-first-coding/SKILL.md) · [Examples](examples/README.md) · [MIT License](LICENSE)

A reusable coding-agent skill for designing game architecture and other software before implementation. Establish responsibilities, authoritative state owners, concrete contracts, lifecycle and dependency direction; then check the real implementation against those decisions.

The skill grew through work on two Godot games: a wave-survival game and a shopping-mall management game. The examples below distill decisions from those projects into original, engine-independent teaching models. The skill itself is broader than games; its current instructions are in Chinese, with an English trigger description.

## What it changes

- Give each state and rule one authoritative owner. Views submit commands and display authoritative results.
- Distinguish source dependencies from runtime calls. Callbacks and event buses can conceal upward dependencies.
- Define actual command/query contracts, failure semantics and lifecycle before cross-module implementation.
- Place shared capabilities at a legitimate layer; avoid global writable contexts and duplicate formulas.
- Check third-party compatibility and licensing before integration, proportional to project needs.
- Scale the work: small edits need a boundary check, larger changes need explicit design. Five responsibilities do not require five empty directories.

The default is a **strict downward five-layer architecture**: interface → application → core → data → platform. Storage contracts live in the data layer. This deliberately differs from architectures where data adapters implement ports declared by the domain. Existing architectures should be mapped and respected rather than silently replaced. Read the [precise dependency rules](skills/architecture-first-coding/references/layered-architecture.md) before applying the default.

## Install in Codex

Clone the repository, then copy **only** `skills/architecture-first-coding` into your personal skills directory. Preserve any local customization before replacing an existing installation.

PowerShell:

```powershell
git clone https://github.com/ZxyAIHelper/architecture-first-coding.git
$skillRoot = if ($env:CODEX_HOME) { Join-Path $env:CODEX_HOME 'skills' } else { Join-Path $env:USERPROFILE '.codex/skills' }
New-Item -ItemType Directory -Path $skillRoot -Force | Out-Null
Copy-Item -LiteralPath './architecture-first-coding/skills/architecture-first-coding' -Destination $skillRoot -Recurse
```

macOS / Linux:

```sh
git clone https://github.com/ZxyAIHelper/architecture-first-coding.git
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R architecture-first-coding/skills/architecture-first-coding "${CODEX_HOME:-$HOME/.codex}/skills/"
```

The Markdown package can also be adapted to other agents that support `SKILL.md`; discovery and installation vary by agent.

## Try it

```text
Use $architecture-first-coding to design a wave-survival game's
restart-current-wave feature. Identify the phase owner, checkpoint contents,
restore contract, feedback identity and failure cases before implementing it.
```

```text
Use $architecture-first-coding to review a mall game's construction flow.
Trace quote → confirm → placement → payment. Check stale quotes, duplicate
confirmation, ownership of prices and balance, and snapshot mutability.
```

## Two worked examples

| Example | Main decision | Run |
| --- | --- | --- |
| [Wave survival / 土豆兄弟](examples/survivor/README.md) | Session owns phase and restart count; battle owns combat state; restore an opening checkpoint without re-awarding entry income | `node examples/survivor/demo.mjs` |
| [Mall management / 模拟经营商场](examples/mall/README.md) | Core recomputes quotes and validates revision before synchronous placement and payment | `node examples/mall/demo.mjs` |

Each includes responsibility and ownership tables, concrete contracts, a full player flow, failure boundaries and an executable model. The models omit game assets, original content tables, engine scenes and full save systems. They illustrate architecture, not complete games or exact reproductions of either project.

## Verify

Use Node.js 22 or newer; there are no npm dependencies.

```sh
node scripts/verify.mjs
```

This checks package links, the publication allowlist and accidental local-path/credential patterns, then runs the behavioral tests for both teaching models. It does not prove every architecture decision correct, validate agent behavior, or run the original games. GitHub Actions runs the same checks.

Contributions should preserve the skill's proportional workflow and make examples demonstrate a concrete architectural decision. Include relevant behavioral verification when changing executable examples.

## License

The skill, documentation and newly authored example code in this repository are released under the [MIT License](LICENSE). The referenced games, their assets and third-party content are outside this repository's distribution.
