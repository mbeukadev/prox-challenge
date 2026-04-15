import ChatInterface from './components/ChatInterface'
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
} from 'lucide-react'

// ── Prox sparkle logo SVG ─────────────────────────────────────────────────
function ProxLogo() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-4 select-none">
      {/* 4-pointed sparkle — traced from the Prox brand mark */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M10 1 L11.5 8.5 L19 10 L11.5 11.5 L10 19 L8.5 11.5 L1 10 L8.5 8.5 Z"
          fill="#f0f4f8"
          fillOpacity="0.9"
        />
        <path
          d="M10 4 L10.8 8.8 L15.5 10 L10.8 11.2 L10 16 L9.2 11.2 L4.5 10 L9.2 8.8 Z"
          fill="#0e1218"
        />
      </svg>
      <span className="text-[15px] font-medium tracking-[-0.01em] text-[#f0f4f8]">
        prox
      </span>
    </div>
  )
}

// ── Nav item ──────────────────────────────────────────────────────────────
interface NavItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  muted?: boolean
}

function NavItem({ icon, label, active, muted }: NavItemProps) {
  return (
    <div
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
      <span className={`flex-shrink-0 ${active ? 'text-[#5eead4]' : ''}`}>
        {icon}
      </span>
      <span className="text-[13px] font-[450] leading-none">{label}</span>
      {active && (
        <ChevronRight size={11} className="ml-auto text-[#4a5568]" />
      )}
    </div>
  )
}

// ── Section label ─────────────────────────────────────────────────────────
function NavSection({ label }: { label: string }) {
  return (
    <p className="px-5 pt-4 pb-1 text-[10px] font-semibold tracking-widest uppercase text-[#4a5568]">
      {label}
    </p>
  )
}

// ── Process pill ──────────────────────────────────────────────────────────
function ProcessRow({
  name,
  polarity,
  note,
}: {
  name: string
  polarity: string
  note: string
}) {
  return (
    <div className="px-5 py-1 flex items-start gap-2">
      <span className="text-[11px] font-semibold text-[#5eead4] w-16 shrink-0 pt-px">
        {name}
      </span>
      <div>
        <span className="text-[11px] text-[#8892a4]">{polarity}</span>
        <span className="text-[10px] text-[#4a5568] block">{note}</span>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0e1218]">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-[#1e2b3a]">

        <ProxLogo />

        {/* Divider */}
        <div className="h-px bg-[#1e2b3a] mx-4 mb-2" />

        {/* Primary nav */}
        <nav className="flex-1 overflow-y-auto py-1">
          <NavItem
            icon={<MessageSquare size={14} />}
            label="Welding Assistant"
            active
          />

          <NavSection label="Quick Reference" />
          <NavItem icon={<Gauge size={14} />}       label="Duty Cycles" />
          <NavItem icon={<Zap size={14} />}         label="Polarity Setup" />
          <NavItem icon={<Wrench size={14} />}      label="Troubleshooting" />
          <NavItem icon={<Layers size={14} />}      label="Wire & Materials" />
          <NavItem icon={<Shield size={14} />}      label="Safety" />

          <NavSection label="Processes" />
          <ProcessRow name="MIG"       polarity="DCEP" note="Gas required" />
          <ProcessRow name="Flux-Core" polarity="DCEN" note="No gas · reversed" />
          <ProcessRow name="TIG"       polarity="DCEN" note="100% Argon" />
          <ProcessRow name="Stick"     polarity="DCEP" note="Fastest setup" />
        </nav>

        {/* Bottom nav */}
        <div className="pb-4 border-t border-[#1e2b3a] pt-3">
          <NavItem icon={<BookOpen size={14} />} label="Manual Pages" />
          <NavItem icon={<Settings size={14} />} label="Settings" muted />
        </div>
      </aside>

      {/* ── Main panel ──────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between px-6 h-12 border-b border-[#1e2b3a] flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-semibold text-[#f0f4f8] tracking-[-0.01em]">
              Welding Assistant
            </h1>
            {/* Status pills — mirrors Prox's "Inbox 5 / Open 2" tab row */}
            <div className="flex items-center gap-1.5">
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
              <span className="w-1.5 h-1.5 rounded-full bg-[#5eead4] opacity-80" />
              claude-haiku-4-5
            </span>
          </div>
        </header>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </main>
    </div>
  )
}
