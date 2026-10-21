'use client';

import { useState } from 'react';
import { List, Plus, Upload, Users, Trash2, UserPlus, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

type ListItem = { id: string; name: string; source: string | null; status: string; createdAt: string; _count: { listContacts: number } };
type Contact = { id: string; name: string; email: string | null };

const NONE = '__none';
const FIELD_OPTS: { key: string; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'title', label: 'Job title' },
];

// Minimal CSV parser that respects double-quoted fields and escaped quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '', row: string[] = [], inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch === '\r') { /* skip */ }
      else field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

// Guess a sensible default mapping from header names.
function guessMapping(headers: string[]): Record<string, string> {
  const m: Record<string, string> = {};
  headers.forEach((h, i) => {
    const l = h.toLowerCase().trim();
    if (!m.email && /e-?mail/.test(l)) m.email = String(i);
    else if (!m.name && /(full ?name|^name|contact)/.test(l)) m.name = String(i);
    else if (!m.phone && /(phone|mobile|tel|cell)/.test(l)) m.phone = String(i);
    else if (!m.title && /(title|designation|role|position)/.test(l)) m.title = String(i);
  });
  return m;
}

export function ListsClient({ companyId, lists: initial, contacts, tenant, canWrite }: { companyId: string; lists: ListItem[]; contacts: Contact[]; tenant: string; canWrite: boolean }) {
  const [lists, setLists] = useState(initial);
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<string>('');
  const [form, setForm] = useState({ name: '', source: 'manual' });
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // CSV prospect upload
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvMap, setCsvMap] = useState<Record<string, string>>({});
  const [csvFileName, setCsvFileName] = useState('');
  const [csvListName, setCsvListName] = useState('');
  const [importing, setImporting] = useState(false);

  const onCsvFile = async (file: File) => {
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) { toast.error('That file has no data rows.'); return; }
    const headers = rows[0].map(h => h.trim());
    setCsvHeaders(headers);
    setCsvData(rows.slice(1));
    setCsvMap(guessMapping(headers));
    setCsvFileName(file.name);
    setCsvListName(file.name.replace(/\.csv$/i, '').slice(0, 60));
  };

  const runCsvImport = async () => {
    if (csvMap.email === undefined && csvMap.name === undefined) { toast.error('Map at least a Name or Email column.'); return; }
    const contacts = csvData.map(r => {
      const pick = (k: string) => (csvMap[k] !== undefined && csvMap[k] !== NONE ? (r[parseInt(csvMap[k], 10)] || '').trim() : '');
      return { name: pick('name'), email: pick('email'), phone: pick('phone'), title: pick('title') };
    }).filter(c => c.email || c.name);
    if (contacts.length === 0) { toast.error('No usable rows after mapping.'); return; }
    setImporting(true);
    try {
      const res = await fetch(`/api/tenant/${tenant}/contacts/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contacts, listName: csvListName, createList: true }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Import failed');
      toast.success(`Imported ${d.created} new, ${d.existing} existing — ${d.linked} added to “${d.listName}”`);
      setCsvOpen(false); setCsvHeaders([]); setCsvData([]); setCsvMap({}); setCsvFileName(''); setCsvListName('');
      reload();
    } catch (e: any) { toast.error(e.message || 'Import failed'); } finally { setImporting(false); }
  };

  const reload = async () => {
    const res = await fetch(`/api/tenant/${tenant}/lists`);
    if (res.ok) setLists(await res.json());
  };

  const createList = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    setSaving(true);
    const res = await fetch(`/api/tenant/${tenant}/lists`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { toast.success('List created'); setOpen(false); setForm({ name: '', source: 'manual' }); reload(); }
    else toast.error('Failed');
  };

  const addContactsToList = async () => {
    if (!selectedList || selectedContacts.length === 0) { toast.error('Select a list and contacts'); return; }
    setSaving(true);
    const res = await fetch(`/api/tenant/${tenant}/lists/${selectedList}/contacts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contactIds: selectedContacts }) });
    setSaving(false);
    if (res.ok) { toast.success(`${selectedContacts.length} contacts added`); setAddOpen(false); setSelectedContacts([]); reload(); }
    else toast.error('Failed');
  };

  const deleteList = async (id: string) => {
    const res = await fetch(`/api/tenant/${tenant}/lists/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); reload(); }
  };

  const toggleContact = (id: string) => {
    setSelectedContacts(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><List className="h-6 w-6" /> Lists & Segments</h1>
          <p className="text-muted-foreground mt-1">{lists.length} lists</p>
        </div>
        {canWrite && (
          <div className="flex items-center gap-2">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm"><UserPlus className="h-4 w-4 mr-1" />Add to List</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Add Contacts to List</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>List</Label>
                    <Select value={selectedList} onValueChange={setSelectedList}>
                      <SelectTrigger><SelectValue placeholder="Select list" /></SelectTrigger>
                      <SelectContent>{lists.map(l => <SelectItem key={l.id} value={l.id}>{l.name} ({l._count.listContacts})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Contacts ({selectedContacts.length} selected)</Label>
                    <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-1">
                      {contacts.map(c => (
                        <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                          <input type="checkbox" checked={selectedContacts.includes(c.id)} onChange={() => toggleContact(c.id)} />
                          {c.name} {c.email && <span className="text-muted-foreground text-xs">({c.email})</span>}
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button onClick={addContactsToList} disabled={saving} className="w-full">{saving ? 'Adding…' : 'Add to List'}</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm"><FileUp className="h-4 w-4 mr-1" />Upload Prospects (CSV)</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Upload prospects from CSV</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>CSV file</Label>
                    <input type="file" accept=".csv,text/csv" className="block w-full text-sm mt-1 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:text-white file:px-3 file:py-1.5 file:text-sm hover:file:bg-primary/90" onChange={e => { const f = e.target.files?.[0]; if (f) onCsvFile(f); }} />
                    <p className="text-xs text-muted-foreground mt-1">First row should be column headers. We’ll auto-detect name, email, phone and title.</p>
                  </div>
                  {csvHeaders.length > 0 && (
                    <>
                      <div className="text-sm text-slate-600">{csvData.length} rows in <span className="font-medium">{csvFileName}</span>. Map your columns:</div>
                      <div className="grid grid-cols-2 gap-3">
                        {FIELD_OPTS.map(f => (
                          <div key={f.key}>
                            <Label className="text-xs">{f.label}</Label>
                            <Select value={csvMap[f.key] ?? NONE} onValueChange={v => setCsvMap(m => ({ ...m, [f.key]: v }))}>
                              <SelectTrigger><SelectValue placeholder="— none —" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NONE}>— none —</SelectItem>
                                {csvHeaders.map((h, i) => <SelectItem key={i} value={String(i)}>{h || `Column ${i + 1}`}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                      <div><Label>Save into list named</Label><Input value={csvListName} onChange={e => setCsvListName(e.target.value)} placeholder="Imported prospects" /></div>
                      <Button onClick={runCsvImport} disabled={importing} className="w-full">{importing ? 'Importing…' : `Import ${csvData.length} prospects`}</Button>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New List</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New List</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Source</Label>
                    <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="import">Import</SelectItem>
                        <SelectItem value="segment">Segment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createList} disabled={saving} className="w-full">{saving ? 'Creating…' : 'Create List'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No lists yet. Create a list to segment your contacts.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {lists.map(l => (
            <div key={l.id} className="border rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{l.name}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Badge variant="outline">{l.source || 'manual'}</Badge>
                  <span>{l._count.listContacts} contacts</span>
                </div>
              </div>
              {canWrite && <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteList(l.id)}><Trash2 className="h-4 w-4" /></Button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
