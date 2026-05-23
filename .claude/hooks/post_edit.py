"""
PostToolUse hook for ppdm-es-troubleshooter.
- Always validates data.js when that file changes (fast, ~0.1s)
- Runs Playwright smoke suite when any JS source or index.html changes (~30s)
"""
import json
import os
import subprocess
import sys

d = json.load(sys.stdin)
f = (d.get("tool_input", {}).get("file_path", "") or "").replace("\\", "/")

if not f:
    sys.exit(0)

cwd = os.getcwd()

# Fast: validate data.js is syntactically loadable
if "data.js" in f:
    r = subprocess.run(
        ["node", "-e", "require('./js/data.js'); console.log('data.js OK')"],
        capture_output=True, text=True, cwd=cwd
    )
    if r.returncode != 0:
        print(f"ERROR: data.js failed to load:\n{r.stderr}")
        sys.exit(1)
    print(r.stdout.strip())

# Playwright: run on JS source or HTML changes
if any(p in f for p in ["js/", "index.html"]):
    print("Running Playwright smoke tests...")
    subprocess.run(["npm", "test"], cwd=cwd)
