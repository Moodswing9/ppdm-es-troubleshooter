# PPDM Elasticsearch Troubleshooter

An interactive, browser-based diagnostic dashboard for troubleshooting **PowerProtect Data Manager (PPDM)** Elasticsearch access errors — no installation, no backend, no build step required.

---

## Features

### 10 Diagnostic Check Modules
| Module | What It Checks |
|---|---|
| Network Connectivity | DNS resolution, TCP port access (9200 / 9300), HTTP response time |
| Service Status | ES process health, JVM state, thread pools, circuit breakers |
| Authentication | Certificate validity, cert chain, basic auth, role permissions |
| Memory Pressure | Heap usage, GC rate, fielddata cache, segment memory |
| Disk Usage | Storage capacity, watermark thresholds, snapshot repo access |
| Shard Distribution | Unassigned / relocating / initializing shards |
| Index Health | Red / Yellow index status resolution per index |
| Corruption Detection | Segment checksums, translog integrity, Lucene version compatibility |
| Search Service Config | PPDM endpoint, index prefix, batch size, retry policy |
| PPDM Log Analysis | Error rate, index throughput, query failure rate |

### 7 Guided Error-Pattern Workflows
Each pattern provides severity-tagged, step-by-step remediation with copy-to-clipboard commands:
- Connection Refused / Unreachable
- Query Timeout
- Authentication Failed
- Out of Memory / Circuit Breaker Tripped
- Disk Full / Watermark Breached
- Red Cluster Status
- Search Query Failed

### Additional Capabilities
- **Dark mode** toggle
- **Live log stream** — timestamped diagnostic activity viewer
- **Connection settings panel** — configure PPDM host, ES host/port, credentials
- **JSON report export** — full diagnostic snapshot as a downloadable `.json` file
- **Print / PDF export** — dedicated print stylesheet

---

## Getting Started

1. Clone or download the repository
2. Open `index.html` in any modern browser
3. (Optional) Click ⚙️ in the header to configure your PPDM and Elasticsearch host details
4. Click **Run Full Diagnostics** or run individual checks per module

No dependencies, no build step, no server required.

---

## Project Structure

```
ppdm-es-troubleshooter/
├── index.html          # Application shell and UI markup
├── css/
│   └── styles.css      # Full design system (dark mode, print, responsive)
└── js/
    ├── data.js         # All diagnostic scenarios and error pattern data
    └── app.js          # Application logic, state management, export
```

---

## License

Copyright (c) 2026 Timur Poyraz. All rights reserved.

No part of this software may be reproduced, distributed, or modified in any form or by any means without express written permission from the copyright holder.
