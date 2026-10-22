'use client';

import React from 'react';

// Lightweight markdown renderer (no external dependency).
// Handles headings, bold, bullet/numbered lists, tables, and paragraphs.
function inline(text: string, keyBase: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*|\[(CONFIRM:[^\]]+|NEEDS REAL CLIENT PROOF[^\]]*)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      parts.push(<strong key={`${keyBase}-b-${i}`}>{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      parts.push(
        <mark key={`${keyBase}-c-${i}`} className="bg-amber-100 text-amber-900 rounded px-1 py-0.5 text-[0.85em] font-medium">[{m[2]}]</mark>
      );
    }
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function isSepRow(line: string): boolean {
  const t = (line || '').trim();
  if (!t.includes('-')) return false;
  for (const ch of t) {
    if (ch !== '|' && ch !== '-' && ch !== ':' && ch !== ' ') return false;
  }
  return true;
}

export function Markdown({ text }: { text: string }) {
  const lines = (text || '').replace(/\r/g, '').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table block
    if (line.includes('|') && i + 1 < lines.length && isSepRow(lines[i + 1])) {
      const header = line.split('|').map((c) => c.trim()).filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length - 1 && c === ''));
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        const cells = lines[i].split('|').map((c) => c.trim()).filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length - 1 && c === ''));
        rows.push(cells);
        i++;
      }
      blocks.push(
        <div key={key++} className="my-3 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                {header.map((h, hi) => (
                  <th key={hi} className="text-left py-2 px-3 font-semibold text-slate-700">{inline(h, `th-${key}-${hi}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-b border-slate-100">
                  {r.map((c, ci) => (
                    <td key={ci} className="py-2 px-3 text-slate-600 align-top">{inline(c, `td-${key}-${ri}-${ci}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const cls = level <= 1 ? 'text-xl font-bold text-slate-900 mt-5 mb-2'
        : level === 2 ? 'text-lg font-bold text-slate-900 mt-4 mb-2'
        : 'text-base font-semibold text-slate-800 mt-3 mb-1';
      blocks.push(<div key={key++} className={cls}>{inline(h[2], `h-${key}`)}</div>);
      i++;
      continue;
    }

    // Bullet list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={key++} className="list-disc pl-6 space-y-1 my-2 text-slate-600 text-sm">
          {items.map((it, ii) => <li key={ii}>{inline(it, `li-${key}-${ii}`)}</li>)}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={key++} className="list-decimal pl-6 space-y-1 my-2 text-slate-600 text-sm">
          {items.map((it, ii) => <li key={ii}>{inline(it, `ol-${key}-${ii}`)}</li>)}
        </ol>
      );
      continue;
    }

    // Blank line
    if (line.trim() === '') { i++; continue; }

    // Paragraph (accumulate consecutive non-empty, non-special lines)
    const para: string[] = [];
    while (
      i < lines.length && lines[i].trim() !== '' &&
      !/^(#{1,6})\s+/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i]) &&
      !(lines[i].includes('|') && i + 1 < lines.length && isSepRow(lines[i + 1]))
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(<p key={key++} className="text-sm text-slate-600 leading-relaxed my-2">{inline(para.join(' '), `p-${key}`)}</p>);
  }

  return <div>{blocks}</div>;
}
