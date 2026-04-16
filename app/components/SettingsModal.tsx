'use client'

import { useEffect, useState } from 'react'
import { X, ChevronRight, Cpu, BookOpen, CreditCard, Bell, Mic, Volume2, Wrench } from 'lucide-react'

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`
        relative w-8 h-4.5 rounded-full transition-colors duration-200 flex-shrink-0 touch-manipulation
        ${enabled ? 'bg-[#f0f4f8]' : 'bg-[#243040]'}
      `}
      style={{ height: '18px', width: '32px' }}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`
          absolute top-0.5 w-3.5 h-3.5 rounded-full transition-transform duration-200
          ${enabled ? 'bg-[#0e1218] translate-x-[15px]' : 'bg-[#4a5568] translate-x-0.5'}
        `}
        style={{ height: '14px', width: '14px' }}
      />
    </button>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function Section({ label }: { label: string }) {
  return (
    <p className="px-4 pt-4 pb-1 text-[9px] font-semibold tracking-widest uppercase text-[#4a5568]">
      {label}
    </p>
  )
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function Row({
  icon,
  label,
  sub,
  right,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  sub?: string
  right?: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 ${onClick ? 'cursor-pointer hover:bg-[#1a2332] transition-colors' : ''}`}
    >
      <span className="text-[#4a5568] flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-[#c4cdd8] leading-none">{label}</p>
        {sub && <p className="text-[10px] text-[#4a5568] mt-0.5 leading-snug">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  // Preferences — persisted to localStorage
  const [voiceInput,  setVoiceInput]  = useState(false)
  const [autoSpeak,   setAutoSpeak]   = useState(false)
  const [toolBadges,  setToolBadges]  = useState(true)
  const [notifications, setNotifications] = useState(false)

  useEffect(() => {
    // Load from localStorage
    setVoiceInput(localStorage.getItem('pref_voiceInput') === '1')
    setAutoSpeak(localStorage.getItem('pref_autoSpeak') === '1')
    setToolBadges(localStorage.getItem('pref_toolBadges') !== '0')
    setNotifications(localStorage.getItem('pref_notifications') === '1')
  }, [])

  function setPref(key: string, val: boolean) {
    localStorage.setItem(key, val ? '1' : '0')
  }

  const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
  useEffect(() => {
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0a0d10]/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative w-full max-w-xs rounded-xl border border-[#1e2b3a] bg-[#0e1218] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2b3a] flex-shrink-0">
          <p className="text-[13px] font-semibold text-[#f0f4f8] tracking-[-0.01em]">Settings</p>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded text-[#4a5568] hover:text-[#f0f4f8] hover:bg-[#1e2b3a] transition-colors"
            aria-label="Close"
          >
            <X size={13} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-[#1e2b3a]">

          {/* ── Account ── */}
          <div>
            <Section label="Account" />
            {/* Avatar row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-[#1a2332] border border-[#243040] flex items-center justify-center flex-shrink-0">
                <span className="text-[13px] font-semibold text-[#8892a4]">MB</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-[#f0f4f8] leading-none">Matthew Beuka</p>
                <p className="text-[10px] text-[#4a5568] mt-0.5">matthewbeuka@gmail.com</p>
              </div>
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#1a2332] border border-[#243040] text-[#8892a4] tracking-wider uppercase">
                Pro
              </span>
            </div>
            <Row
              icon={<ChevronRight size={13} />}
              label="Edit profile"
              onClick={() => {}}
            />
            <Row
              icon={<ChevronRight size={13} />}
              label="Sign out"
              sub="matthewbeuka@gmail.com"
              onClick={() => {}}
            />
          </div>

          {/* ── Billing ── */}
          <div>
            <Section label="Billing" />
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] text-[#c4cdd8]">Current plan</p>
                <span className="text-[10px] font-semibold text-[#f0f4f8] bg-[#1a2332] border border-[#243040] px-2 py-0.5 rounded">
                  Pro — $29/mo
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-[#4a5568]">Requests this month</p>
                <p className="text-[10px] text-[#8892a4] font-mono">247 / unlimited</p>
              </div>
              {/* Usage bar */}
              <div className="w-full h-1 bg-[#1e2b3a] rounded-full overflow-hidden">
                <div className="h-full bg-[#f0f4f8]/40 rounded-full" style={{ width: '24%' }} />
              </div>
            </div>
            <Row
              icon={<CreditCard size={13} />}
              label="Manage billing"
              sub="Update payment method or plan"
              right={<ChevronRight size={12} className="text-[#4a5568]" />}
              onClick={() => {}}
            />
          </div>

          {/* ── Machine ── */}
          <div>
            <Section label="Machine Profile" />
            <Row
              icon={<Cpu size={13} />}
              label="Vulcan OmniPro 220"
              sub="Item 57812 · MIG · Flux-Cored · TIG · Stick"
              right={<ChevronRight size={12} className="text-[#4a5568]" />}
              onClick={() => {}}
            />
            <Row
              icon={<BookOpen size={13} />}
              label="Knowledge base"
              sub="36 manual pages · 6 active tools"
            />
          </div>

          {/* ── Preferences ── */}
          <div>
            <Section label="Preferences" />
            <Row
              icon={<Mic size={13} />}
              label="Voice input"
              sub="Enable microphone for hands-free prompts"
              right={
                <Toggle enabled={voiceInput} onChange={v => { setVoiceInput(v); setPref('pref_voiceInput', v) }} />
              }
            />
            <Row
              icon={<Volume2 size={13} />}
              label="Auto-read responses"
              sub="Speak assistant replies aloud"
              right={
                <Toggle enabled={autoSpeak} onChange={v => { setAutoSpeak(v); setPref('pref_autoSpeak', v) }} />
              }
            />
            <Row
              icon={<Wrench size={13} />}
              label="Show tool activity"
              sub="Display which tools fired on each response"
              right={
                <Toggle enabled={toolBadges} onChange={v => { setToolBadges(v); setPref('pref_toolBadges', v) }} />
              }
            />
            <Row
              icon={<Bell size={13} />}
              label="Notifications"
              sub="Alerts for duty cycle limits and warnings"
              right={
                <Toggle enabled={notifications} onChange={v => { setNotifications(v); setPref('pref_notifications', v) }} />
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#1e2b3a] bg-[#0e1218] flex-shrink-0 flex items-center justify-between">
          <p className="text-[10px] text-[#2d3f52]">prox · v2.0</p>
          <p className="text-[10px] text-[#2d3f52]">Built for Prox</p>
        </div>
      </div>
    </div>
  )
}
