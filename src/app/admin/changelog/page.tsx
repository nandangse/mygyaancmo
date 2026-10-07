import fs from "node:fs";
import path from "node:path";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";

type Entry = { version: string; date: string; type: string; summary: string; commit: string | null };

async function Changelog() {
  await connection();
  // TODO(1.0.1): replace with Mygyaan-admin session check once auth lands.
  if (process.env.ADMIN_PREVIEW !== "1") notFound();

  const entries: Entry[] = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "changelog/entries.json"), "utf8"),
  );
  const current = fs.readFileSync(path.join(process.cwd(), "VERSION"), "utf8").trim();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Changelog</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Current version <span className="font-mono">v{current}</span>
      </p>
      <ol className="mt-6 space-y-4">
        {entries.map((e) => (
          <li key={e.version} className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-mono font-semibold">v{e.version}</span>
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">{e.type}</span>
              <span className="text-zinc-500">{e.date.split("-").reverse().join("-").replace(/^(\d+)-(\d+)-20(\d+)$/, "$1-$2-$3")}</span>
              {e.commit && <span className="font-mono text-xs text-zinc-500">{e.commit}</span>}
            </div>
            <p className="mt-2">{e.summary}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}

export default function ChangelogPage() {
  return (
    <Suspense fallback={<main className="p-6">Loading…</main>}>
      <Changelog />
    </Suspense>
  );
}
