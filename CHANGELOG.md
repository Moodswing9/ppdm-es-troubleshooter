# Changelog

## [1.5.0] — 2026-11-10
### Changed
- AI Diagnose moves to **Claude Haiku 5.5** (`claude-haiku-5-5`) with thinking off and `medium` effort, in the browser app and in `/es-diagnose` and `/ppdm-check`. Measured on an Elasticsearch flood-stage watermark incident: $0.0006 per diagnosis vs $0.0035 on Haiku 4.5 (about 6x cheaper), slightly faster, and a more specific diagnosis
- The browser request uses API version `2026-10-21` and drops the obsolete `anthropic-beta: prompt-caching-2024-07-31` header (prompt caching is generally available and still applied through `cache_control`)
- The forced `ppdm_es_diagnosis` tool call stays: Haiku 5.5 accepts it

### Fixed
- If Claude declines, AI Diagnose shows a clear message instead of an empty card; the text fallback reads text blocks by type instead of assuming the first block is text
- CLAUDE.md gave the browser's `max_tokens` as 1024; it is 2048

## [1.4.2] — 2026-11-07
### Security
- `follow-redirects` → 1.16.2 (dev, via the `http-server` used for tests): sensitive headers could be kept on cross-realm redirects. `npm audit`: 0 vulnerabilities

### Changed
- `@playwright/test` 1.59 → 1.65: GitHub's `ubuntu-latest` runner moved to Ubuntu 26.04, where the older Playwright could not install its browsers, so CI failed before running any tests

## [1.4.1] — 2026-10-12
### Fixed
- Claude Code plugin manifest passes `claude plugin validate`: `repository` is a URL, `license` is MIT and the unsupported `components` field is gone; the commands in `.claude/commands/` are now declared, so they load
- Install docs: the plugin is now installed from the Moodswing9 marketplace (`claude plugin marketplace add Moodswing9/claude-plugins`, then `claude plugin install ppdm-es-troubleshooter@moodswing9`). The previously documented `npx skills add` installs only the skill, not the slash commands

### Added
- CI validates the plugin manifest on every push and pull request

## [1.4.0] — 2026-06-02
### Added
- `/ppdm-check` — live Elasticsearch cluster health check: fetches cluster health, nodes, shards and allocation, then returns a GREEN/YELLOW/RED assessment with remediation commands via Claude Haiku 4.5

### Changed
- Mission Control redesign: new visual style with full light and dark modes
- High-resolution light and dark screenshots

## [1.3.0] — 2026-05-15
### Added
- AI Diagnose tab — Claude Haiku 4.5 root-cause analysis with regex-based PII redaction before sending to API
- `esProtocol` state (http/https) persisted alongside other settings
- Settings persistence via localStorage (`ppdmEsTroubleshooter.settings`) — restored on page load (API key excluded)

## [1.2.0] — 2026-05-12
### Added
- 7 guided error-pattern workflows with step-by-step remediation
- JSON report export — full diagnostic snapshot downloadable as `.json`
- Dark mode toggle

## [1.1.0] — 2026-05-05
### Added
- Live log stream panel — tail PPDM Elasticsearch logs in real time
- 10 diagnostic modules: cluster health, shard allocation, index status, node connectivity, JVM heap, disk watermark, thread pool, circuit breakers, snapshot status, index lifecycle

## [1.0.0] — 2026-04-23
### Added
- Browser-based diagnostic dashboard for PPDM Elasticsearch access errors
- No backend required — all logic runs in the browser
- Connection settings panel (host, port, protocol, credentials)
