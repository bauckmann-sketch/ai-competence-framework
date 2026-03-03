#!/usr/bin/env python3
"""Push v13 changes directly to GitHub via API — no git credentials needed."""
import os, base64, requests

GH_TOKEN = "<string>:1: DeprecationWarning: Attribute s is deprecated and will be removed in Python 3.14; use value instead REDACTED_TOKEN"  # viz push_uifixes.py
GH_USERNAME = "bauckmann-sketch"
GH_REPO = "ai-competence-framework"
GH_HEADERS = {"Authorization": f"token {GH_TOKEN}", "Accept": "application/vnd.github.v3+json"}
BASE_DIR = r"C:\Users\David\.gemini\antigravity\scratch\ai-competence-framework"

files = [
    "src/app/api/submit/route.ts",
    "src/app/api/test-email/route.ts",
    "src/app/page.tsx",
    "src/app/r/[id]/page.tsx",
    "src/app/sandbox/page.tsx",
    "src/components/fitness-report.tsx",
    "src/components/results-dashboard.tsx",
    "src/data/ui_strings.json",
    "src/data/v13/copy.json",
    "src/data/v13/questions.json",
    "src/data/v13/scoring.json",
    "src/lib/persistence.ts",
]

COMMIT_MSG = "feat: v13 integration — areas A-E, no archetypes, sandbox, radar chart, community fix, remove F references"

for path in files:
    local = os.path.join(BASE_DIR, path.replace("/", os.sep))
    if not os.path.exists(local):
        print(f"{path}: SKIP (not found locally)")
        continue
    with open(local, "rb") as f:
        encoded = base64.b64encode(f.read()).decode()
    url = f"https://api.github.com/repos/{GH_USERNAME}/{GH_REPO}/contents/{path}"
    r = requests.get(url, headers=GH_HEADERS)
    sha = r.json().get("sha")  # None for new files
    data = {"message": COMMIT_MSG, "content": encoded}
    if sha:
        data["sha"] = sha
    r = requests.put(url, headers=GH_HEADERS, json=data)
    status = "✓ OK" if r.status_code in [200, 201] else f"✗ ERR {r.status_code}: {r.text[:80]}"
    print(f"{path}: {status}")
