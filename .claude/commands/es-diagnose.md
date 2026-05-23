---
description: Diagnose a PPDM Elasticsearch error or log excerpt — structured root-cause analysis with severity, affected component, remediation commands, and prevention via Claude Haiku 4.5
argument-hint: "<error-text-or-file-path>"
allowed-tools: ["Bash", "Read"]
---

The user wants to diagnose: $ARGUMENTS

**Execute every step yourself. Do not ask the user to run commands.**

## Step 1 — Determine input type

`$ARGUMENTS` is one of:
1. **Multiple file paths** — two or more paths separated by spaces. Use the Read tool on each file, then concatenate their contents with a `--- <filename> ---` separator line between them. Cap the combined total at 30,000 characters (trim from the middle of each file proportionally if needed).
2. **Single file path** — starts with `/`, `./`, `C:\`, or ends in `.log`, `.txt`, `.out`. Use the Read tool to load it.
3. **Inline error text** — use the content of `$ARGUMENTS` directly as the input.

If `$ARGUMENTS` is empty, stop:
> "Provide an error message or log file path — example: `/es-diagnose 'connection refused to 9200'` or `/es-diagnose /var/log/ppdm/es-error.log` or `/es-diagnose es-error.log es-slow.log`"

## Step 2 — Redact PII and call Claude Haiku 4.5

Use the Bash tool to run the following Python script. Substitute `INPUT_TEXT` with the actual error text or file contents from Step 1:

```bash
python3 - << 'PYEOF'
import re, json
import anthropic

INPUT_TEXT = """<substitute error text or file contents here>"""

def redact(text):
    text = re.sub(r'Bearer\s+[A-Za-z0-9\-._~+/]+=*', 'Bearer [REDACTED]', text, flags=re.IGNORECASE)
    text = re.sub(r'Basic\s+[A-Za-z0-9+/]+=*', 'Basic [REDACTED]', text, flags=re.IGNORECASE)
    text = re.sub(r'("(?:password|passwd|secret|token|api_key)"\s*:\s*)"[^"]*"', r'\1"[REDACTED]"', text, flags=re.IGNORECASE)
    text = re.sub(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', '[EMAIL]', text)
    text = re.sub(r'\b(\d{1,3}\.\d{1,3})\.\d{1,3}\.\d{1,3}\b', r'\1.x.x', text)
    return text

SCHEMA = {
    'name': 'ppdm_es_diagnosis',
    'description': 'Structured PPDM/Elasticsearch root-cause diagnosis',
    'input_schema': {
        'type': 'object',
        'properties': {
            'root_cause':           {'type': 'string', 'description': 'One-sentence root cause diagnosis'},
            'severity':             {'type': 'string', 'enum': ['Critical', 'High', 'Medium', 'Low']},
            'affected_component':   {'type': 'string', 'description': 'The specific ES or PPDM subsystem affected'},
            'actions':              {'type': 'array', 'items': {'type': 'string'},
                                     'description': 'Ordered remediation steps with exact CLI commands'},
            'prevention':           {'type': 'string', 'description': '1–2 sentences on preventing recurrence'},
        },
        'required': ['root_cause', 'severity', 'affected_component', 'actions', 'prevention'],
    },
}

client = anthropic.Anthropic()
resp = client.messages.create(
    model='claude-haiku-4-5-20251001',
    max_tokens=1024,
    system=(
        'You are an expert Dell EMC PowerProtect Data Manager (PPDM) and Elasticsearch administrator. '
        'Analyse the provided log excerpt or symptom description. '
        'You MUST call the ppdm_es_diagnosis tool with your structured analysis. '
        'Use real PPDM/ES commands (mminfo, nsradmin, curl ES REST API, etc.) in the actions array.'
    ),
    tools=[SCHEMA],
    tool_choice={'type': 'tool', 'name': 'ppdm_es_diagnosis'},
    messages=[{'role': 'user', 'content': redact(INPUT_TEXT[:30000])}],
)

tool_block = next((b for b in resp.content if b.type == 'tool_use'), None)
if not tool_block:
    print('(no structured response returned)')
    raise SystemExit(1)

d = tool_block.input
SEV_ICON = {'Critical': '🔴', 'High': '🟠', 'Medium': '🟡', 'Low': '🟢'}.get(d.get('severity',''), '⚪')

print(f"\n{'─'*60}")
print(f"  {SEV_ICON}  {d.get('severity','?').upper()}  ·  {d.get('affected_component','?')}")
print(f"{'─'*60}\n")
print(f"ROOT CAUSE\n  {d.get('root_cause','')}\n")
print("IMMEDIATE ACTIONS")
for i, action in enumerate(d.get('actions', []), 1):
    print(f"  {i}. {action}")
print(f"\nPREVENTION\n  {d.get('prevention','')}\n")
print(f"{'─'*60}\n")
PYEOF
```

## Step 3 — Handle errors

| Error | Response |
|---|---|
| `AuthenticationError` | "Set your API key: `export ANTHROPIC_API_KEY=sk-ant-…`" |
| `ModuleNotFoundError: anthropic` | "Install the SDK: `pip install anthropic`" |
| `FileNotFoundError` | Report the exact path — do not guess alternatives |
| Tool call missing in response | Print raw response content and note the model didn't follow the tool schema |

## Reference — Common PPDM ES error patterns

Use this to pre-annotate your diagnosis before calling the model:

| Error pattern | Likely component | Key command |
|---|---|---|
| `connection refused` on port 9200/9300 | ES Network | `curl -u user:pass http://ES_HOST:9200/_cluster/health` |
| `authentication_exception` | ES Auth / PPDM Search Service config | `GET /_security/user` |
| `circuit_breaking_exception` | ES Memory / Heap | `GET /_nodes/stats/breaker` |
| `disk watermark exceeded` | ES Disk / Storage | `GET /_cat/allocation?v` |
| `cluster_block_exception` (read-only) | ES Disk full | `PUT /_settings {"index.blocks.read_only_allow_delete": null}` |
| `index [*] missing` | ES Index / PPDM index prefix | `GET /_cat/indices?v` |
| unassigned shards | ES Shard allocation | `GET /_cluster/allocation/explain` |
