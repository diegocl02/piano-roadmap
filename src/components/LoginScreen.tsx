'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--t-bg)] flex flex-col items-center justify-center p-8">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
            <Music className="w-8 h-8 text-cyan-500" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--t-head)]">Piano Roadmap</h1>
          <p className="text-[var(--t-mute)] text-sm mt-1 text-center">
            Tu plan de estudio personalizado
          </p>
        </div>

        {sent ? (
          <div className="text-center bg-[var(--t-surf)] border border-[var(--t-bord2)] rounded-xl p-6">
            <p className="text-2xl mb-3">✉️</p>
            <p className="text-[var(--t-head)] font-semibold mb-1">Revisa tu email</p>
            <p className="text-[var(--t-mute)] text-sm">
              Enviamos un link de acceso a{' '}
              <span className="text-[var(--t-text)] font-mono">{email}</span>
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-xs text-cyan-500 hover:text-cyan-400 mt-4 font-mono transition-colors"
            >
              Usar otro email
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              autoFocus
              className="w-full bg-[var(--t-surf2)] border border-[var(--t-bord)] rounded-lg px-4 py-3 text-sm text-[var(--t-text)] placeholder:text-[var(--t-placeholder)] focus:outline-none focus:border-cyan-500 font-mono"
            />
            <Button
              onClick={handleSend}
              disabled={!email.trim() || loading}
              className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-mono font-bold disabled:opacity-40"
            >
              {loading ? 'ENVIANDO...' : 'ENVIAR MAGIC LINK'}
            </Button>
            <p className="text-[10px] text-[var(--t-mute3)] text-center font-mono pt-1">
              Sin contraseña — te enviamos un link directo a tu email.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
