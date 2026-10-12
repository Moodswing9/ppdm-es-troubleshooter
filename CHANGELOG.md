# Changelog

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
