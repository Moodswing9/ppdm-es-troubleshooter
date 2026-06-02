---
description: Live Elasticsearch cluster health check — fetches /_cluster/health and gives an instant status summary with actionable recommendations
argument-hint: '<es-host> [--port 9200] [--user elastic] [--pass <password>] [--ssl]'
allowed-tools: ["Bash"]
---

The user wants to check: $ARGUMENTS

**Execute every step yourself. Do not ask the user to run commands.**

## Step 1 — Parse arguments

From `$ARGUMENTS` extract:
- **ES host** — first positional arg (required). May be hostname or IP.
- `--port N` — ES HTTP port (default: 9200)
- `--user` — ES username (default: none / anonymous)
- `--pass` — ES password
- `--ssl` — use HTTPS instead of HTTP

If no host is given, stop:
> "Provide an Elasticsearch host — example: `/ppdm-check es01.example.com` or `/ppdm-check localhost --port 9200 --user elastic --pass secret`"

## Step 2 — Fetch cluster health and key stats

Use the Bash tool to fetch the health data:

```bash
python3 - << 'PYEOF'
import json, sys, urllib.request, urllib.error, base64, ssl

HOST     = "<substitute host>"
PORT     = 9200           # substitute
USER     = ""             # substitute or leave empty
PASSWORD = ""             # substitute or leave empty
USE_SSL  = False          # substitute

scheme = "https" if USE_SSL else "http"
base   = f"{scheme}://{HOST}:{PORT}"

ctx = ssl.create_default_context() if USE_SSL else None
if ctx:
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

headers = {}
if USER:
    creds = base64.b64encode(f"{USER}:{PASSWORD}".encode()).decode()
    headers["Authorization"] = f"Basic {creds}"

def fetch(path):
    req = urllib.request.Request(f"{base}{path}", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"_error": str(e), "_status": e.code}
    except Exception as e:
        return {"_error": str(e)}

health    = fetch("/_cluster/health")
stats     = fetch("/_cluster/stats?human&pretty=false")
nodes     = fetch("/_cat/nodes?v&h=name,heapPercent,diskUsedPercent,cpu,role&format=json")
shards    = fetch("/_cat/shards?v&h=index,shard,prirep,state,unassigned.reason&format=json&s=state:desc")
disk_alloc = fetch("/_cat/allocation?v&format=json")

print(json.dumps({
    "health":    health,
    "stats":     {"indices": stats.get("indices", {}), "_nodes": stats.get("_nodes", {})},
    "nodes":     nodes,
    "shards_sample": [s for s in (shards if isinstance(shards, list) else []) if s.get("state") != "STARTED"][:20],
    "disk":      disk_alloc,
}, indent=2))
PYEOF
```

If the fetch fails with a connection error, stop with:
> "Cannot reach Elasticsearch at `<host>:<port>`. Verify the host is reachable and the port is correct."

## Step 3 — AI health summary

Use the Bash tool to pipe the JSON output into Claude Haiku 4.5:

```bash
python3 - << 'PYEOF'
import json, anthropic

CLUSTER_DATA = """<substitute full JSON from Step 2>"""

SCHEMA = {
    'name': 'es_health_check',
    'description': 'Structured Elasticsearch cluster health assessment',
    'input_schema': {
        'type': 'object',
        'properties': {
            'status':     {'type': 'string', 'enum': ['GREEN', 'YELLOW', 'RED'], 'description': 'Overall cluster status'},
            'headline':   {'type': 'string', 'description': 'One-sentence summary of cluster state'},
            'issues':     {'type': 'array', 'items': {'type': 'string'}, 'description': 'Specific problems found (empty if none)'},
            'actions':    {'type': 'array', 'items': {'type': 'string'}, 'description': 'Ordered remediation steps with exact ES API or PPDM commands'},
            'next_check': {'type': 'string', 'description': 'Single most important metric to watch next'},
        },
        'required': ['status', 'headline', 'issues', 'actions', 'next_check'],
    },
}

client = anthropic.Anthropic()
resp = client.messages.create(
    model='claude-haiku-4-5-20251001',
    max_tokens=1024,
    system=(
        'You are an expert Dell EMC PPDM and Elasticsearch administrator. '
        'Analyse the provided cluster health JSON and call the es_health_check tool with your assessment. '
        'Focus on unassigned shards, heap pressure, disk watermarks, and node failures. '
        'Provide exact curl/ES REST API commands in the actions array.'
    ),
    tools=[SCHEMA],
    tool_choice={'type': 'tool', 'name': 'es_health_check'},
    messages=[{'role': 'user', 'content': f'Cluster data:\n\n{CLUSTER_DATA[:20000]}'}],
)

tool_block = next((b for b in resp.content if b.type == 'tool_use'), None)
if not tool_block:
    print('(no structured response)')
    raise SystemExit(1)

d = tool_block.input
STATUS_ICON = {'GREEN': '🟢', 'YELLOW': '🟡', 'RED': '🔴'}.get(d.get('status', ''), '⚪')

print(f"\n{'─'*60}")
print(f"  {STATUS_ICON}  {d.get('status','?')}  ·  Elasticsearch Cluster Health")
print(f"{'─'*60}\n")
print(f"  {d.get('headline','')}\n")

issues = d.get('issues', [])
if issues:
    print("ISSUES DETECTED")
    for issue in issues:
        print(f"  • {issue}")
    print()

actions = d.get('actions', [])
if actions:
    print("RECOMMENDED ACTIONS")
    for i, action in enumerate(actions, 1):
        print(f"  {i}. {action}")
    print()

print(f"WATCH NEXT\n  {d.get('next_check','')}\n")
print(f"{'─'*60}\n")
PYEOF
```

## Step 4 — Handle errors

| Error | Response |
|---|---|
| `AuthenticationError` | "Set your API key: `export ANTHROPIC_API_KEY=sk-ant-…`" |
| `ModuleNotFoundError: anthropic` | "Install the SDK: `pip install anthropic`" |
| Connection refused | "Elasticsearch is not reachable at `<host>:<port>` — check host, port, and firewall" |
| HTTP 401 | "Authentication failed — provide `--user` and `--pass`" |
| HTTP 403 | "Insufficient permissions — the user needs `monitor` cluster privilege" |
