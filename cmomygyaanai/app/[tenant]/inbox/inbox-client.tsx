'use client';

import { useState, useMemo } from 'react';
import { Inbox, Mail, MessageSquare, Linkedin, Phone, Star, Archive, Filter, ArrowDownUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type Msg = { id: string; contactId: string | null; direction: string; channel: string | null; subject: string | null; body: string | null; classification: string | null; isMql: boolean; createdAt: string };

const CHANNEL_ICONS: Record<string, any> = { email: Mail, whatsapp: MessageSquare, linkedin: Linkedin };
const CLASS_COLORS: Record<string, string> = {
  interested: 'bg-green-100 text-green-700', not_interested: 'bg-red-100 text-red-700', has_vendor: 'bg-orange-100 text-orange-700',
  no_budget: 'bg-amber-100 text-amber-700', next_quarter: 'bg-blue-100 text-blue-700', in_house: 'bg-purple-100 text-purple-700',
  too_busy: 'bg-gray-100 text-gray-700', send_info: 'bg-cyan-100 text-cyan-700', ooo: 'bg-yellow-100 text-yellow-700',
  wrong_person: 'bg-pink-100 text-pink-700', unsubscribe: 'bg-red-100 text-red-800',
};

export function InboxClient({ companyId, messages: initial, tenant, canWrite }: { companyId: string; messages: Msg[]; tenant: string; canWrite: boolean }) {
  const [messages, setMessages] = useState(initial);
  const [channelFilter, setChannelFilter] = useState('all');
  const [dirFilter, setDirFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [selected, setSelected] = useState<Msg | null>(null);

  const filtered = useMemo(() => messages.filter(m => {
    if (channelFilter !== 'all' && m.channel !== channelFilter) return false;
    if (dirFilter !== 'all' && m.direction !== dirFilter) return false;
    if (classFilter !== 'all' && m.classification !== classFilter) return false;
    return true;
  }), [messages, channelFilter, dirFilter, classFilter]);

  const classify = async (id: string, classification: string) => {
    const res = await fetch(`/api/tenant/${tenant}/inbox/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classification }) });
    if (res.ok) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, classification } : m));
      if (selected?.id === id) setSelected({ ...selected, classification });
      toast.success('Classified');
    }
  };

  const markMql = async (id: string) => {
    const res = await fetch(`/api/tenant/${tenant}/inbox/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isMql: true }) });
    if (res.ok) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isMql: true } : m));
      toast.success('Marked as MQL');
    }
  };

  const uniqueClassifications = [...new Set(messages.map(m => m.classification).filter(Boolean))] as string[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Inbox className="h-6 w-6" /> Unified Inbox</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} of {messages.length} messages</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1"><Filter className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Filter:</span></div>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Channel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dirFilter} onValueChange={setDirFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Direction" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
          </SelectContent>
        </Select>
        {uniqueClassifications.length > 0 && (
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Classification" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {uniqueClassifications.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: 400 }}>
        {/* Message list */}
        <div className="lg:col-span-1 border rounded-lg overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No messages</div>
            ) : (
              filtered.map(m => {
                const Icon = CHANNEL_ICONS[m.channel || ''] || Mail;
                return (
                  <div key={m.id} className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${selected?.id === m.id ? 'bg-muted' : ''}`} onClick={() => setSelected(m)}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className={`text-xs ${m.direction === 'inbound' ? 'text-blue-600' : 'text-gray-500'}`}>{m.direction}</span>
                      {m.isMql && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                      {m.classification && <Badge className={`text-[10px] ${CLASS_COLORS[m.classification] || ''}`}>{m.classification.replace(/_/g, ' ')}</Badge>}
                    </div>
                    <div className="font-medium text-sm mt-1 truncate">{m.subject || '(no subject)'}</div>
                    <div className="text-xs text-muted-foreground truncate">{m.body?.slice(0, 80)}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{new Date(m.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Message detail */}
        <div className="lg:col-span-2 border rounded-lg p-4">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg">{selected.subject || '(no subject)'}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="capitalize">{selected.channel}</span> · <span>{selected.direction}</span>
                    {selected.isMql && <Badge variant="default" className="text-xs bg-amber-500">MQL</Badge>}
                  </div>
                </div>
                {canWrite && (
                  <div className="flex items-center gap-2">
                    {!selected.isMql && <Button size="sm" variant="outline" onClick={() => markMql(selected.id)}><Star className="h-3 w-3 mr-1" />MQL</Button>}
                    <Select value={selected.classification || ''} onValueChange={v => classify(selected.id, v)}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="Classify" /></SelectTrigger>
                      <SelectContent>
                        {['interested','not_interested','has_vendor','no_budget','next_quarter','in_house','too_busy','send_info','ooo','wrong_person','unsubscribe'].map(c =>
                          <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="whitespace-pre-wrap text-sm border-t pt-4">{selected.body}</div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Select a message to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
