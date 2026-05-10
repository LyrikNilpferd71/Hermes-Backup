# Hermes Backup

Automated, sanitized backups of Hermes Agent state.

What is backed up:
- `~/.hermes/config.yaml`
- `~/.hermes/memories/MEMORY.md`
- `~/.hermes/skills/**`

What is intentionally excluded:
- `~/.hermes/.env`
- tokens, credentials, and other secrets
- session logs, gateway logs, and state databases

The backup job writes timestamped snapshots into `snapshots/` and commits them to this repository.
