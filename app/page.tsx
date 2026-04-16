'use client'

import { useState, useRef } from 'react'
import ChatInterface, { type ChatInterfaceHandle } from './components/ChatInterface'
import ManualGallery from './components/ManualGallery'
import {
  MessageSquare,
  Gauge,
  Zap,
  Wrench,
  Layers,
  Shield,
  Settings,
  BookOpen,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Prox sparkle logo
// ─────────────────────────────────────────────────────────────────────────────

function ProxLogo() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-4 select-none">
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M1 2 L10 7 L17 4 L15 8 L19 10 L15 14 L10 18 L6 14 Z"
          fill="#f0f4f8"
          fillOpacity="0.92"
        />
      </svg>
      <span className="text-[15px] font-medium tracking-[-0.01em] text-[#f0f4f8]">prox</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav item
// ─────────────────────────────────────────────────────────────────────────────

interface NavItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  muted?: boolean
  onClick?: () => void
}

function NavItem({ icon, label, active, muted, onClick }: NavItemProps) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-2.5 px-3 py-1.5 rounded-md mx-2 cursor-pointer
        transition-colors duration-100
        ${active
          ? 'bg-[#1a2332] text-[#f0f4f8]'
          : muted
            ? 'text-[#4a5568] hover:text-[#8892a4]'
            : 'text-[#8892a4] hover:text-[#c4cdd8] hover:bg-[#141c24]'
        }
      `}
    >
      <span className={`flex-shrink-0 ${active ? 'text-[#f0f4f8]' : ''}`}>{icon}</span>
      <span className="text-[13px] font-[450] leading-none">{label}</span>
      {active && <ChevronRight size={11} className="ml-auto text-[#4a5568]" />}
    </div>
  )
}

function NavSection({ label }: { label: string }) {
  return (
    <p className="px-5 pt-4 pb-1 text-[10px] font-semibold tracking-widest uppercase text-[#4a5568]">
      {label}
    </p>
  )
}

function ProcessRow({ name, polarity, note }: { name: string; polarity: string; note: string }) {
  return (
    <div className="px-5 py-1 flex items-start gap-2">
      <span className="text-[11px] font-semibold text-[#e2e8f0] w-16 shrink-0 pt-px">{name}</span>
      <div>
        <span className="text-[11px] text-[#8892a4]">{polarity}</span>
        <span className="text-[10px] text-[#4a5568] block">{note}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// View type
// ─────────────────────────────────────────────────────────────────────────────

type View = 'chat' | 'gallery'

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view,        setView]        = useState<View>('chat')
  const chatRef = useRef<ChatInterfaceHandle>(null)

  // Close sidebar, switch to chat, and send a preset message
  function sendPreset(prompt: string) {
    setSidebarOpen(false)
    setView('chat')
    // Small delay so view switches before ChatInterface is mounted/visible
    setTimeout(() => chatRef.current?.sendMessage(prompt), 50)
  }

  function openGallery() {
    setSidebarOpen(false)
    setView('gallery')
  }

  const isChat    = view === 'chat'
  const isGallery = view === 'gallery'

  return (
    <div className="flex h-screen overflow-hidden bg-[#0e1218]">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50
          w-64 md:w-56 flex-shrink-0 flex flex-col
          border-r border-[#1e2b3a] bg-[#0e1218]
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Logo row */}
        <div className="flex items-center justify-between">
          <ProxLogo />
          <button
            onClick={() => setSidebarOpen(false)}
            className="mr-4 p-1 text-[#4a5568] hover:text-[#8892a4] transition-colors md:hidden"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <div className="h-px bg-[#1e2b3a] mx-4 mb-2" />

        {/* Primary nav */}
        <nav className="flex-1 overflow-y-auto py-1">
          <NavItem
            icon={<MessageSquare size={14} />}
            label="Welding Assistant"
            active={isChat}
            onClick={() => { setSidebarOpen(false); setView('chat') }}
          />

          <NavSection label="Quick Reference" />
          <NavItem
            icon={<Gauge size={14} />}
            label="Duty Cycles"
            onClick={() => sendPreset('Show me all duty cycle specs for every process and voltage.')}
          />
          <NavItem
            icon={<Zap size={14} />}
            label="Polarity Setup"
            onClick={() => sendPreset('Show me polarity setup for all four processes.')}
          />
          <NavItem
            icon={<Wrench size={14} />}
            label="Troubleshooting"
            onClick={() => sendPreset('What are common welding problems and how do I fix them?')}
          />
          <NavItem
            icon={<Layers size={14} />}
            label="Wire & Materials"
            onClick={() => sendPreset('What wire sizes and materials can I weld with the OmniPro 220?')}
          />
          <NavItem
            icon={<Shield size={14} />}
            label="Safety"
            onClick={() => sendPreset('What are the safety warnings I need to know before welding?')}
          />

          <NavSection label="Processes" />
          <ProcessRow name="MIG"       polarity="DCEP" note="Gas required" />
          <ProcessRow name="Flux-Core" polarity="DCEN" note="No gas · reversed" />
          <ProcessRow name="TIG"       polarity="DCEN" note="100% Argon" />
          <ProcessRow name="Stick"     polarity="DCEP" note="Fastest setup" />
        </nav>

        {/* Bottom nav */}
        <div className="pb-4 border-t border-[#1e2b3a] pt-3">
          <NavItem
            icon={<BookOpen size={14} />}
            label="Manual Pages"
            active={isGallery}
            onClick={openGallery}
          />
          <NavItem icon={<Settings size={14} />} label="Settings" muted />
        </div>
      </aside>

      {/* ── Main panel ───────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Safe-area spacer — fills iOS status bar height, bg matches page */}
        <div className="flex-shrink-0 bg-[#0e1218]" style={{ height: 'env(safe-area-inset-top)' }} />

        {/* Top bar — fixed 48px, no safe-area math needed here */}
        <header className="flex items-center justify-between px-4 md:px-6 h-12 border-b border-[#1e2b3a] flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Hamburger — mobile only, 44×44 touch target */}
            <button
              className="md:hidden -ml-2 w-11 h-11 flex items-center justify-center text-[#4a5568] hover:text-[#8892a4] active:text-[#f0f4f8] transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {/* Logo on mobile */}
            <div className="flex items-center gap-2 md:hidden">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M1 2 L10 7 L17 4 L15 8 L19 10 L15 14 L10 18 L6 14 Z"
                  fill="#f0f4f8" fillOpacity="0.9" />
              </svg>
              <span className="text-[14px] font-medium text-[#f0f4f8] tracking-[-0.01em]">prox</span>
            </div>

            <h1 className="text-[15px] font-semibold text-[#f0f4f8] tracking-[-0.01em] hidden md:block">
              {isGallery ? 'Manual Pages' : 'Welding Assistant'}
            </h1>

            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#1a2332] border border-[#243040] text-[#f0f4f8] font-medium">
                OmniPro 220
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full text-[#8892a4]">
                4 processes
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[#4a5568]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] opacity-80" />
              <span className="hidden sm:inline">claude-haiku-4-5</span>
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isGallery
            ? <ManualGallery onClose={() => setView('chat')} />
            : <ChatInterface ref={chatRef} />
          }
        </div>
      </main>
    </div>
  )
}
