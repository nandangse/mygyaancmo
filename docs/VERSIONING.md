# Versioning — six-part number `A.B.C.D.E.F`

| Seg | Meaning | Example |
| --- | --- | --- |
| A | Platform generation | `1` |
| B | Phase. `0` = Phase 1 under build; becomes `1` when Phase 1 acceptance criteria all pass; `2`, `3` follow | `1.1…` = Phase 1 shipped |
| C | Build step from scope section 10 (1–12) | `1.0.3…` = Knowledge base |
| D | Feature within the step | |
| E | Change / iteration of a feature | |
| F | Fix or small patch | |

Rules
- Every commit bumps exactly one segment; all segments to its right reset to 0.
- Every commit carries a changelog entry (`changelog/entries.json`) and the version in its subject: `feat(kb): upload area [v1.0.3.1.0.0]`.
- Use `npm run log -- --bump <A|B|C|D|E|F> --type <feat|fix|change|chore|docs> "summary"` before committing. It updates `VERSION`, `package.json`, `entries.json`, `CHANGELOG.md`.
- The commit-msg hook (`.githooks/commit-msg`) rejects commits without the version tag or without a staged changelog change.
- Admin page `/admin/changelog` renders `entries.json`.
