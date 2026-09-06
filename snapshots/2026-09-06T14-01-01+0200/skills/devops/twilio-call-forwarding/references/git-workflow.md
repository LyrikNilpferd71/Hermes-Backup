# Git Workflow — Syncing a Local Hermes Agent Dir with GitHub

When an existing Hermes agent directory (e.g. `/opt/hermes-2/`) is **not yet a git repo** but the GitHub repo already exists with content, use this sync pattern.

## 1. GitHub auth (headless / server)

```bash
gh auth login --hostname github.com --git-protocol https --web
```

This prints a one-time code like `BBBB-1CF1`. Open `https://github.com/login/device` in a browser (on any machine), enter the code, and authorize. The CLI on the server then has a working token.

Default scope on login includes `repo`, `workflow`, `read:org`, `gist`. Verify:

```bash
gh auth status
# → ✓ Logged in to github.com account <user>
```

## 2. Init local dir as repo

```bash
cd /opt/hermes-2

# Init local repo (default branch is "master" — rename to "main")
git init
git branch -m main

# Add the remote
git remote add origin https://github.com/<user>/<repo>.git
```

## 3. Fetch remote & merge with unrelated history

The remote already has commits (`README.md` or initial commit). The local dir has files that were never part of that history.

```bash
git fetch origin main
git merge --allow-unrelated-histories origin/main
```

`--allow-unrelated-histories` is **required** because the two histories share no common ancestor (one was created via `git init` locally, the other on GitHub).

## 4. Handle "embedded git repository" warnings

If a subdirectory (e.g. `backup/`, `supabase/`) has its own `.git/` directory, `git add` will treat it as a **git submodule** rather than tracking its files:

```
warning: adding embedded git repository: backup
```

Fix: remove the nested `.git` to flatten the subdirectory into the parent repo.

```bash
rm -rf backup/.git
git add backup/
```

**Before doing this**, check if the subdirectory was intentionally a standalone repo (e.g. a backup script that pushes to its own remote). If yes, consider `git submodule add <url> backup/` instead. In most Hermes agent setups, these nested repos were incidental and flattening is safe.

## 5. Add files & commit

```bash
# .gitignore first
echo ".env" >> .gitignore
echo "twilio/calls.log" >> .gitignore
echo "twilio/node_modules/" >> .gitignore

git add .gitignore twilio/ other-files-you-want
git status                          # verify before commit
git commit -m "Your descriptive message"
```

## 6. Push

```bash
git push -u origin main
```

The `-u` sets upstream tracking so subsequent pushes are just `git push`.

## Common pitfalls

| Pitfall | How it manifests | Fix |
|---|---|---|
| **Unrelated histories** | `fatal: refusing to merge unrelated histories` | Add `--allow-unrelated-histories` to `git merge` |
| **Embedded `.git`** | Warning on `git add`, files not tracked as a directory | `rm -rf path/to/.git` and re-add |
| **`gh` not logged in** | `HTTP 403` or `auth required` on push | `gh auth login --web` and complete device flow |
| **Wrong default branch name** | Local branch is `master`, remote is `main` | `git branch -m master main` before merge |
| **.env accidentally committed** | Secrets in git history | Add to `.gitignore` BEFORE first `git add` |
| **Committer identity** | `Your name and email address were configured automatically` | `git config --global user.name "Name" && git config --global user.email "email"` |