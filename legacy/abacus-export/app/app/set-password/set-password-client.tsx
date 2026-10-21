'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, CheckCircle2, ShieldAlert } from 'lucide-react';

export function SetPasswordClient({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-rose-500 mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Invalid Link</h1>
          <p className="text-slate-500">This password-setup link is invalid. Please contact your administrator for a new link.</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Password Set Successfully</h1>
          <p className="text-slate-500 mb-6">You can now sign in with your new password.</p>
          <Button asChild className="bg-[#0b1733] hover:bg-[#162550]">
            <a href="/login">Go to Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  const valid = password.length >= 8 && password === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-xl font-bold text-slate-800 mb-1">Set Your Password</h1>
        <p className="text-sm text-slate-500 mb-6">Choose a strong password (minimum 8 characters).</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pw">Password</Label>
            <div className="relative mt-1">
              <Input id="pw" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" autoComplete="new-password" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShow(!show)} tabIndex={-1}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="cpw">Confirm Password</Label>
            <Input id="cpw" type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" className="mt-1" autoComplete="new-password" />
            {confirm && password !== confirm && <p className="text-xs text-rose-500 mt-1">Passwords do not match.</p>}
          </div>
          {error && <p className="text-sm text-rose-600 bg-rose-50 rounded p-2">{error}</p>}
          <Button type="submit" disabled={!valid || busy} className="w-full bg-[#0b1733] hover:bg-[#162550]">
            {busy ? 'Setting password…' : 'Set Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
