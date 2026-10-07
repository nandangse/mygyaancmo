#!/usr/bin/env node
// Usage: node scripts/changelog.mjs --bump F --type fix "summary" | --sync
import fs from "node:fs";
import { execSync } from "node:child_process";

const file = "changelog/entries.json";
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i > -1 ? args[i + 1] : null; };
const entries = JSON.parse(fs.readFileSync(file, "utf8"));

if (args.includes("--sync")) {
  // backfill commit hashes by matching "[vX.X.X.X.X.X]" in commit subjects
  for (const e of entries) {
    if (e.commit) continue;
    try {
      const h = execSync(`git log --fixed-strings --grep="[v${e.version}]" --format=%h -n1`).toString().trim();
      if (h) e.commit = h;
    } catch {}
  }
} else {
  const bump = (opt("bump") || "F").toUpperCase();
  const type = opt("type") || "feat";
  const summary = args.filter((a, i) => !a.startsWith("--") && !["--bump", "--type"].includes(args[i - 1])).join(" ");
  if (!summary) { console.error("summary required"); process.exit(1); }
  const idx = "ABCDEF".indexOf(bump);
  if (idx < 0) { console.error("bump must be A-F"); process.exit(1); }
  const cur = fs.readFileSync("VERSION", "utf8").trim().split(".").map(Number);
  const next = cur.map((n, i) => (i < idx ? n : i === idx ? n + 1 : 0));
  const version = next.join(".");
  entries.unshift({ version, date: new Date().toISOString().slice(0, 10), type, summary, commit: null });
  fs.writeFileSync("VERSION", version + "\n");
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  pkg.version = next.slice(0, 3).join(".") + "-" + next.slice(3).join(".");
  fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
  console.log(`v${version}`);
}
fs.writeFileSync(file, JSON.stringify(entries, null, 2) + "\n");
const md = ["# Changelog", "", "Version scheme: see docs/VERSIONING.md. Newest first.", ""];
for (const e of entries) md.push(`## v${e.version} — ${e.date} — ${e.type}${e.commit ? ` — ${e.commit}` : ""}`, "", e.summary, "");
fs.writeFileSync("CHANGELOG.md", md.join("\n"));
