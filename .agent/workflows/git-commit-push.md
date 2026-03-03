---
description: how to commit and push changes to GitHub
---

# Git Commit & Push via Python GitHub API

## Context

`git` is NOT directly available in the PowerShell terminal PATH on this machine.
Use the Python GitHub API approach instead to commit files.

## Required Info

- **Repo**: `bauckmann-sketch/ai-competence-framework`
- **Branch**: `main`
- **Token**: Read from `C:\Users\David\.git-credentials` — format: `https://USERNAME:TOKEN@github.com`

## Workflow Steps

### 1. Read the token from git-credentials
```python
import re
with open(r'C:\Users\David\.git-credentials', 'r') as f:
    content = f.read()
match = re.search(r'https://[^:]+:([^@]+)@github.com', content)
GH_TOKEN = match.group(1).strip()
```

### 2. Commit one or more files via GitHub API

For each file to commit, use this Python snippet — run as a single script:

```python
import os, base64, re, requests, json

# --- Config ---
REPO = "bauckmann-sketch/ai-competence-framework"
BRANCH = "main"
COMMIT_MESSAGE = "Your commit message here"

# Files to commit: list of local absolute paths relative to repo root
FILES_TO_COMMIT = [
    ("src/components/cta-section.tsx", r"c:\Users\David\.gemini\antigravity\scratch\ai-competence-framework\src\components\cta-section.tsx"),
    ("src/components/results-dashboard.tsx", r"c:\Users\David\.gemini\antigravity\scratch\ai-competence-framework\src\components\results-dashboard.tsx"),
    ("src/data/v8/questions.json", r"c:\Users\David\.gemini\antigravity\scratch\ai-competence-framework\src\data\v8\questions.json"),
]

# Read token
with open(r'C:\Users\David\.git-credentials', 'r') as f:
    cred = f.read()
GH_TOKEN = re.search(r'https://[^:]+:([^@]+)@github.com', cred).group(1).strip()

HEADERS = {
    "Authorization": f"token {GH_TOKEN}",
    "Accept": "application/vnd.github.v3+json",
}
BASE_URL = f"https://api.github.com/repos/{REPO}/contents"

for repo_path, local_path in FILES_TO_COMMIT:
    # Get current SHA of the file on GitHub
    r = requests.get(f"{BASE_URL}/{repo_path}?ref={BRANCH}", headers=HEADERS)
    r.raise_for_status()
    sha = r.json()["sha"]

    # Read local file and base64-encode
    with open(local_path, "rb") as f:
        content_b64 = base64.b64encode(f.read()).decode("utf-8")

    # Push the update
    payload = {
        "message": COMMIT_MESSAGE,
        "content": content_b64,
        "sha": sha,
        "branch": BRANCH,
    }
    r2 = requests.put(f"{BASE_URL}/{repo_path}", headers=HEADERS, json=payload)
    r2.raise_for_status()
    print(f"✅ Committed: {repo_path}")

print("Done!")
```

### 3. Run via PowerShell
```powershell
python -c "<paste script here>"
```
Or save to a temp file and run:
```powershell
python C:\temp\commit.py
```

## Notes
- Each file gets its own commit (GitHub API limitation per file, unless using tree API)
- If you want a single commit for multiple files, use the Git Tree API (more complex)
- The SHA must be fetched fresh each time — it changes with every commit
