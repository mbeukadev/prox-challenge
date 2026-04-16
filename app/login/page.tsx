'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

const DEMO_EMAIL    = 'mbeukadev@prox.inc'
const DEMO_PASSWORD = 'dev123456'
const DEMO_NAME     = 'Matthew Beuka'

export default function LoginPage() {
  const router = useRouter()

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [gLoading,  setGLoading]  = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      setLoading(true)
      localStorage.setItem('prox_user', JSON.stringify({ name: DEMO_NAME, email: DEMO_EMAIL }))
      setTimeout(() => router.push('/'), 900)
    } else {
      setError('Invalid email or password.')
    }
  }

  function handleGoogle() {
    setGLoading(true)
    localStorage.setItem('prox_user', JSON.stringify({ name: DEMO_NAME, email: DEMO_EMAIL }))
    setTimeout(() => router.push('/'), 1200)
  }

  return (
    <div className="min-h-screen bg-[#0e1218] flex items-center justify-center p-4">

      {/* Card */}
      <div className="w-full max-w-[380px] flex flex-col items-center">

        {/* ── Logos ── */}
        <div className="flex flex-col items-center gap-4 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/proxlogo.png" alt="prox" style={{ height: '52px', width: 'auto' }} />
          <div className="flex items-center gap-2.5">
            <div className="h-px w-10 bg-[#1e2b3a]" />
            <span className="text-[10px] text-[#2d3f52] tracking-widest uppercase font-medium">powered by</span>
            <div className="h-px w-10 bg-[#1e2b3a]" />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vulcanlogo.png" alt="Vulcan" style={{ height: '20px', width: 'auto', opacity: 0.5 }} />
        </div>

        {/* ── Sign-in card ── */}
        <div className="w-full rounded-2xl border border-[#1e2b3a] bg-[#0a0d10] p-6 shadow-2xl">

          <h1 className="text-[18px] font-semibold text-[#f0f4f8] tracking-[-0.01em] mb-1">
            Welcome back
          </h1>
          <p className="text-[12px] text-[#4a5568] mb-6">
            Sign in to your Prox workspace
          </p>

          {/* Google OAuth (fake) */}
          <button
            onClick={handleGoogle}
            disabled={gLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl
              border border-[#1e2b3a] bg-[#0e1218] hover:bg-[#141c24] hover:border-[#243040]
              text-[13px] font-medium text-[#c4cdd8] transition-colors duration-150
              disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {gLoading ? (
              <span className="w-4 h-4 rounded-full border-2 border-[#4a5568] border-t-[#f0f4f8] animate-spin" />
            ) : (
              /* Google G logo */
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {gLoading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#1e2b3a]" />
            <span className="text-[11px] text-[#2d3f52]">or</span>
            <div className="flex-1 h-px bg-[#1e2b3a]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#4a5568] uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={DEMO_EMAIL}
                autoComplete="email"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1218] border border-[#1e2b3a]
                  text-[13px] text-[#f0f4f8] placeholder:text-[#2d3f52]
                  focus:outline-none focus:border-[#2d3f52] transition-colors"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#4a5568] uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#0e1218] border border-[#1e2b3a]
                    text-[13px] text-[#f0f4f8] placeholder:text-[#2d3f52]
                    focus:outline-none focus:border-[#2d3f52] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2d3f52] hover:text-[#4a5568] transition-colors"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#180f0f] border border-[#3a2020]">
                <AlertCircle size={12} className="text-[#f87171] flex-shrink-0" />
                <p className="text-[11px] text-[#fca5a5]">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || gLoading}
              className="mt-1 w-full py-2.5 rounded-xl bg-[#f0f4f8] text-[#0e1218]
                text-[13px] font-semibold hover:bg-white active:bg-[#e2e8f0]
                transition-colors duration-100 disabled:opacity-50
                disabled:cursor-not-allowed touch-manipulation flex items-center justify-center gap-2"
            >
              {loading
                ? <span className="w-4 h-4 rounded-full border-2 border-[#4a5568] border-t-[#0e1218] animate-spin" />
                : 'Sign in'
              }
            </button>

          </form>
        </div>

        {/* Hint for demo */}
        <div className="mt-5 px-4 py-3 rounded-xl bg-[#0a0d10] border border-[#1e2b3a] w-full">
          <p className="text-[10px] text-[#2d3f52] text-center font-mono leading-relaxed">
            {DEMO_EMAIL}<br />
            <span className="tracking-widest">dev123456</span>
          </p>
        </div>

        <p className="mt-6 text-[10px] text-[#2d3f52] text-center">
          Prox · OmniPro 220 · Built for Harbor Freight
        </p>
      </div>
    </div>
  )
}
