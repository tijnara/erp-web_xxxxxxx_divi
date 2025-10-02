// src/app/login/page.tsx  (replace your return JSX with this UI)
'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const ALLOWED_PREFIXES = ['/dashboard', '/admin', '/operation', '/hr', '/reports'];
function safeNextPath(input: string | null) {
    if (!input) return '/dashboard';
    if (typeof window === 'undefined') return '/dashboard';
    try {
        const url = new URL(input, window.location.origin);
        const path = url.pathname || '/dashboard';
        return ALLOWED_PREFIXES.some((p) => path.startsWith(p)) ? `${path}${url.search}${url.hash}` : '/dashboard';
    } catch { return '/dashboard'; }
}

export default function LoginPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const nextPath = useMemo(() => safeNextPath(sp.get('next')), [sp]);

    const [tab, setTab] = useState<'password'|'rfid'>('password');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rf, setRf] = useState('');
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const rfidInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (tab === 'rfid') {
            rfidInputRef.current?.focus();
        }
    }, [tab]);

    async function loginPassword(e: React.FormEvent) {
        e.preventDefault();
        setErr(null); setLoading(true);
        const res = await fetch('/api/auth/login', {
            method: 'POST', headers: { 'Content-Type':'application/json' },
            body: JSON.stringify({ email, password })
        });
        setLoading(false);
        if (!res.ok) {
            const j = await res.json().catch(()=> ({}));
            setErr(j?.error || 'Login failed');
            return;
        }
        router.replace(nextPath);
    }

    async function loginRfid(e: React.FormEvent) {
        e.preventDefault();
        setErr(null); setLoading(true);
        const res = await fetch('/api/auth/login-rfid', {
            method: 'POST', headers: { 'Content-Type':'application/json' },
            body: JSON.stringify({ rf })
        });
        setLoading(false);
        if (!res.ok) {
            const j = await res.json().catch(()=> ({}));
            setErr(j?.error || 'RFID login failed');
            return;
        }
        router.replace(nextPath);
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-sm border rounded-2xl p-6 bg-white dark:bg-zinc-950">
                <h1 className="text-xl font-semibold mb-3">Sign in</h1>

                <div className="mb-4 flex rounded-lg overflow-hidden border dark:border-zinc-800">
                    <button
                        className={`flex-1 px-3 py-2 text-sm ${tab==='password'?'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900':''}`}
                        onClick={()=>setTab('password')}
                    >Email & Password</button>
                    <button
                        className={`flex-1 px-3 py-2 text-sm ${tab==='rfid'?'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900':''}`}
                        onClick={()=>setTab('rfid')}
                    >RFID</button>
                </div>

                {tab === 'password' ? (
                    <form onSubmit={loginPassword} className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-sm">Email</label>
                            <input type="email" autoFocus required value={email}
                                   onChange={e=>setEmail(e.target.value)}
                                   className="border rounded px-3 py-2 w-full bg-white dark:bg-zinc-900"/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm">Password</label>
                            <input type="password" required value={password}
                                   onChange={e=>setPassword(e.target.value)}
                                   className="border rounded px-3 py-2 w-full bg-white dark:bg-zinc-900"/>
                        </div>
                        {err && <div className="text-red-600 text-sm">{err}</div>}
                        <button disabled={loading} className="w-full rounded px-3 py-2 border bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-60">
                            {loading ? 'Signing in…' : 'Login'}
                        </button>
                        <div className="text-xs text-zinc-500">Redirect to: <code>{nextPath}</code></div>
                    </form>
                ) : (
                    <form onSubmit={loginRfid} className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-sm">Scan your RFID</label>
                            <input
                                ref={rfidInputRef}
                                inputMode="numeric"
                                autoFocus
                                required
                                value={rf}
                                onChange={e=>setRf(e.target.value)}
                                onKeyDown={(e)=>{ if(e.key==='Enter'){ /* allow submit */ } }}
                                className="border rounded px-3 py-2 w-full tracking-widest bg-white dark:bg-zinc-900"
                                placeholder="Waiting for scan…"
                            />
                            <p className="text-xs text-zinc-500">Most scanners act like a keyboard—focus the field and scan.</p>
                        </div>
                        {err && <div className="text-red-600 text-sm">{err}</div>}
                        <button disabled={loading || !rf} className="w-full rounded px-3 py-2 border bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-60">
                            {loading ? 'Signing in…' : 'Login with RFID'}
                        </button>
                        <div className="text-xs text-zinc-500">Redirect to: <code>{nextPath}</code></div>
                    </form>
                )}
            </div>
        </main>
    );
}
