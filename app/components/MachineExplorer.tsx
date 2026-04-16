'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, ChevronRight, Zap } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Hotspot {
  id: string
  label: string
  shortLabel: string
  x: number   // % from left edge of image
  y: number   // % from top edge of image
  description: string
  importance: 'critical' | 'high' | 'normal'
  safetyNote?: string
  tips: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Hotspot data — Front Panel (page-08-front-panel-controls.png)
// ─────────────────────────────────────────────────────────────────────────────

const FRONT_PANEL_HOTSPOTS: Hotspot[] = [
  {
    id: 'lcd_display',
    label: 'LCD Display',
    shortLabel: 'LCD',
    x: 63, y: 37,
    description: 'Shows current process, wire speed, voltage, and material preset. Confirm what\'s displayed before striking an arc — it\'s your last safety check.',
    importance: 'critical',
    tips: [
      'Reads "MIG Steel C25" style labels — confirm process matches what you\'re actually doing',
      'Updates live as you turn knobs — watch it while adjusting',
      'Press Home button if you lose your place in menus',
    ],
  },
  {
    id: 'home_button',
    label: 'Home Button',
    shortLabel: 'Home',
    x: 22, y: 29,
    description: 'Returns to the main welding screen from any menu. Press any time you get lost in settings.',
    importance: 'high',
    tips: [
      'Safe to press mid-setup — does not interrupt active arc',
      'Use when the display shows an unfamiliar menu',
    ],
  },
  {
    id: 'back_button',
    label: 'Back Button',
    shortLabel: 'Back',
    x: 79, y: 28,
    description: 'Steps back one level in the settings menu without returning all the way home.',
    importance: 'normal',
    tips: ['Useful for navigating nested optional settings menus'],
  },
  {
    id: 'control_knob',
    label: 'Control Knob',
    shortLabel: 'Ctrl Knob',
    x: 21, y: 37,
    description: 'Main selector knob. Turn to cycle through welding processes and menu options. Press to confirm a selection.',
    importance: 'critical',
    tips: [
      'Turn: MIG → Flux-Cored → TIG → Stick (cycles)',
      'Press: confirm the highlighted menu item',
      'In welding mode: adjusts wire speed for MIG/Flux-Cored',
    ],
  },
  {
    id: 'left_knob',
    label: 'Left Knob — Wire Speed / Amps',
    shortLabel: 'L Knob',
    x: 22, y: 49,
    description: 'Controls wire feed speed (IPM) for MIG/Flux-Cored or output amperage for TIG/Stick.',
    importance: 'critical',
    tips: [
      'MIG / Flux-Cored: wire speed in inches per minute',
      'TIG / Stick: output amperage directly',
      'Turn slowly — small changes have big effects on thin metal',
    ],
  },
  {
    id: 'right_knob',
    label: 'Right Knob — Voltage',
    shortLabel: 'R Knob',
    x: 78, y: 49,
    description: 'Sets output voltage for MIG/Flux-Cored. Balance this with wire speed — they must work together.',
    importance: 'critical',
    tips: [
      'Higher voltage = flatter, wider bead with more penetration',
      'Lower voltage = narrower bead, less penetration',
      'Mismatched voltage + wire speed = excessive spatter or burn-through',
    ],
  },
  {
    id: 'power_switch',
    label: 'Power Switch',
    shortLabel: 'Power',
    x: 20, y: 59,
    description: 'Main on/off switch. Always switch OFF before changing wire, swapping polarity, or opening the machine.',
    importance: 'critical',
    safetyNote: 'ALWAYS power off before: changing wire, swapping polarity connections, or performing any internal access. Failure to do so risks electric shock.',
    tips: [
      'Allow 30–60 sec after power-on before first arc',
      'If thermal protection trips: power off, let fan cool the unit, then restart',
      'LED indicator confirms power state',
    ],
  },
  {
    id: 'gun_socket',
    label: 'MIG Gun / Spool Gun Socket',
    shortLabel: 'Gun Port',
    x: 22, y: 67,
    description: 'Euro-style socket for the MIG gun or spool gun cable. Twist-lock to secure. Polarity must match the process.',
    importance: 'critical',
    safetyNote: 'Polarity check required: MIG = gun to negative socket. Flux-Cored = gun to positive socket. Wrong polarity causes poor arc and heavy spatter.',
    tips: [
      'Twist clockwise until firm — loose connections cause arc instability',
      'MIG: gun connects here (negative side)',
      'Flux-Cored: gun cable moves to positive socket (swap ground too)',
      'Inspect threads before each session',
    ],
  },
  {
    id: 'gas_outlet',
    label: 'Spool Gun Gas Outlet',
    shortLabel: 'Gas Out',
    x: 20, y: 76,
    description: 'Gas hose fitting for an optional spool gun attachment. Standard MIG shielding gas connects at the rear regulator, not here.',
    importance: 'normal',
    tips: [
      'Only used with optional spool gun accessory',
      'Standard MIG: run shielding gas hose to the rear gas inlet',
    ],
  },
  {
    id: 'storage',
    label: 'Storage Compartment',
    shortLabel: 'Storage',
    x: 78, y: 60,
    description: 'Small door for keeping spare consumables within arm\'s reach — contact tips, nozzles, or the electrode holder.',
    importance: 'normal',
    tips: [
      'Keep spare 0.030" and 0.035" contact tips here',
      'Store stick electrode holder here when TIG welding',
    ],
  },
  {
    id: 'positive_socket',
    label: 'Positive (+) Socket',
    shortLabel: 'Pos (+)',
    x: 76, y: 70,
    description: 'Positive output terminal. Ground clamp goes here for MIG, TIG, and Stick. For Flux-Cored the gun cable goes here instead.',
    importance: 'critical',
    safetyNote: 'MIG/TIG/Stick: ground clamp = positive. Flux-Cored: gun cable = positive. Wrong polarity causes poor fusion and arc instability.',
    tips: [
      'MIG / TIG / Stick: ground clamp plugs in here',
      'Flux-Cored: gun cable moves here (reversed from MIG)',
      'Power off before swapping any connections',
    ],
  },
  {
    id: 'negative_socket',
    label: 'Negative (−) Socket',
    shortLabel: 'Neg (−)',
    x: 43, y: 83,
    description: 'Negative output terminal. Gun/torch plugs here for MIG, TIG, and Stick. For Flux-Cored the ground clamp goes here.',
    importance: 'critical',
    safetyNote: 'Verify polarity every session when switching between MIG and Flux-Cored. A wrong connection can damage workpieces.',
    tips: [
      'MIG / TIG / Stick: gun or torch = negative socket',
      'Flux-Cored: ground clamp = negative socket',
      'Hand-tighten firmly — loose connection = arc instability',
    ],
  },
  {
    id: 'wire_feed_cable',
    label: 'Wire Feed Power Cable',
    shortLabel: 'Feed Cable',
    x: 58, y: 82,
    description: 'Integrated cable that powers the internal wire feed motor. Do not disconnect.',
    importance: 'normal',
    tips: [
      'Inspect cable sheath for cracks or damage before each session',
      'Route away from hot metal and sharp workpiece edges',
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Hotspot data — Interior (product-inside.webp)
// ─────────────────────────────────────────────────────────────────────────────

const INTERIOR_HOTSPOTS: Hotspot[] = [
  {
    id: 'settings_chart',
    label: 'Settings Reference Chart',
    shortLabel: 'Chart',
    x: 50, y: 22,
    description: 'Laminated quick-reference chart printed on the inside door panel. Shows recommended settings for MIG, Flux-Cored, TIG, and Stick across common material thicknesses.',
    importance: 'high',
    tips: [
      'Use as your starting baseline — fine-tune from there',
      'Shows duty cycle ratings per process at a glance',
      'Open the door and prop it while setting up a new process',
    ],
  },
  {
    id: 'wire_spool',
    label: 'Wire Spool Hub',
    shortLabel: 'Spool Hub',
    x: 32, y: 65,
    description: 'Accepts 4" (1–2 lb) spools directly, or 8" (10–12 lb) spools with the included plastic adapter. Center the spool on the hub and tighten the retaining nut.',
    importance: 'high',
    tips: [
      'Hand-tighten the retaining nut only — over-tightening causes wire drag',
      'Use the plastic adapter for 8" spools (stored in the storage compartment)',
      'Feed 6" of wire through the liner before closing the door on a new spool',
    ],
  },
  {
    id: 'drive_rolls',
    label: 'Drive Roll Assembly',
    shortLabel: 'Drive Rolls',
    x: 62, y: 62,
    description: 'Feeds wire from the spool through the liner to the gun. V-Groove rolls for solid MIG wire. Knurled rolls for flux-cored wire. The roll type is stamped on the roll.',
    importance: 'critical',
    safetyNote: 'Wrong roll type = wire slippage or deformation. V-Groove for solid wire (smooth channel). Knurled for flux-cored wire (serrated grip).',
    tips: [
      'Check the stamp on the roll — "V" for solid, "K" for knurled',
      'Clean rolls monthly with a stiff wire brush',
      'Worn grooves cause bird\'s nesting — inspect if you see feed problems',
    ],
  },
  {
    id: 'tension_knob',
    label: 'Wire Tension Adjustment',
    shortLabel: 'Tension',
    x: 33, y: 57,
    description: 'Controls the grip pressure the drive rolls apply to the wire. The #1 cause of bird\'s nesting is incorrect tension — too tight crushes flux-cored wire, too loose causes slippage.',
    importance: 'critical',
    safetyNote: 'Set tension to minimum pressure that prevents wire slippage. Excess tension on flux-cored wire crushes the flux core and causes severe feed problems.',
    tips: [
      'Start at minimum, increase by quarter-turns until feed is consistent',
      'Test: hold gun 2" from metal, pull trigger — wire should feed without slipping',
      'Flux-cored wire needs less tension than solid wire',
      'Re-check tension whenever you change wire spool or wire type',
    ],
  },
  {
    id: 'wire_liner',
    label: 'Wire Liner / Guide',
    shortLabel: 'Liner',
    x: 50, y: 70,
    description: 'Flexible conduit that guides wire from the drive rolls through the gun cable to the contact tip. A kinked or contaminated liner is a common cause of inconsistent wire feed.',
    importance: 'high',
    tips: [
      'Inspect for kinks, especially near the gun connector',
      'Replace if wire feed becomes rough or inconsistent after checking tension and rolls',
      'Blow out with compressed air monthly',
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Tab config
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  {
    id: 'front_panel' as const,
    label: 'Front Panel',
    image: '/manual-pages/page-08-front-panel-controls.png',
    hotspots: FRONT_PANEL_HOTSPOTS,
    bgFit: 'contain' as const,
    bgColor: '#ffffff',
  },
  {
    id: 'interior' as const,
    label: 'Interior',
    image: '/product-inside.webp',
    hotspots: INTERIOR_HOTSPOTS,
    bgFit: 'cover' as const,
    bgColor: '#0a0d10',
  },
]

type TabId = 'front_panel' | 'interior'

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface MachineExplorerProps {
  highlight?: string       // hotspot id to auto-select
  initialTab?: TabId
  inline?: boolean         // true = compact chat artifact, false = full sidebar view
}

// ─────────────────────────────────────────────────────────────────────────────
// Hotspot pin
// ─────────────────────────────────────────────────────────────────────────────

function HotspotPin({
  hotspot,
  active,
  highlighted,
  onClick,
  inline,
}: {
  hotspot: Hotspot
  active: boolean
  highlighted: boolean
  onClick: () => void
  inline: boolean
}) {
  const colorClass =
    hotspot.importance === 'critical' ? 'border-[#f0f4f8] bg-[#f0f4f8]/20'
    : hotspot.importance === 'high'    ? 'border-[#8892a4] bg-[#8892a4]/15'
    :                                    'border-[#4a5568] bg-[#4a5568]/10'

  const activeColor =
    hotspot.importance === 'critical' ? 'bg-[#f0f4f8] border-[#f0f4f8]'
    : hotspot.importance === 'high'    ? 'bg-[#8892a4] border-[#8892a4]'
    :                                    'bg-[#4a5568] border-[#4a5568]'

  const pinSize = inline ? 'w-5 h-5' : 'w-6 h-6'
  const fontSize = inline ? 'text-[8px]' : 'text-[9px]'

  return (
    <button
      onClick={onClick}
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2
        ${pinSize} rounded-full border-2 flex items-center justify-center
        transition-all duration-150 cursor-pointer z-10
        ${active || highlighted
          ? `${activeColor} scale-125 shadow-[0_0_0_4px_rgba(240,244,248,0.15)]`
          : `${colorClass} hover:scale-110`
        }
        ${highlighted && !active ? 'animate-pulse' : ''}
      `}
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
      aria-label={hotspot.label}
      title={hotspot.label}
    >
      <span className={`${fontSize} font-bold leading-none select-none
        ${active || highlighted ? 'text-[#0e1218]' : 'text-[#f0f4f8]'}`}
      >
        {hotspot.shortLabel.charAt(0)}
      </span>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail panel
// ─────────────────────────────────────────────────────────────────────────────

function DetailPanel({ hotspot, onClose }: { hotspot: Hotspot; onClose: () => void }) {
  return (
    <div className="border-t border-[#1e2b3a] bg-[#0e1218] p-4 animate-in slide-in-from-bottom-2 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {hotspot.importance === 'critical' && (
            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#f0f4f8]" />
          )}
          <h3 className="text-[13px] font-semibold text-[#f0f4f8] leading-snug">
            {hotspot.label}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-[#4a5568] hover:text-[#f0f4f8] transition-colors"
          aria-label="Close"
        >
          <X size={11} />
        </button>
      </div>

      {/* Safety note — prominent if present */}
      {hotspot.safetyNote && (
        <div className="flex gap-2 bg-[#1a1008] border border-[#3a2510] rounded-lg px-3 py-2.5 mb-3">
          <AlertTriangle size={12} className="text-[#fb923c] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#fdba74] leading-relaxed">{hotspot.safetyNote}</p>
        </div>
      )}

      {/* Description */}
      <p className="text-[12px] text-[#c4cdd8] leading-relaxed mb-3">{hotspot.description}</p>

      {/* Tips */}
      {hotspot.tips.length > 0 && (
        <ul className="space-y-1.5">
          {hotspot.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-[#8892a4] leading-snug">
              <ChevronRight size={10} className="flex-shrink-0 mt-0.5 text-[#4a5568]" />
              {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function MachineExplorer({
  highlight,
  initialTab = 'front_panel',
  inline = false,
}: MachineExplorerProps) {
  const [activeTab,   setActiveTab]   = useState<TabId>(initialTab)
  const [activeHotspot, setActiveHotspot] = useState<string | null>(highlight ?? null)

  // When highlight changes (e.g. from a new tool call), auto-select it
  useEffect(() => {
    if (!highlight) return
    // Figure out which tab this hotspot belongs to
    const inFront = FRONT_PANEL_HOTSPOTS.some(h => h.id === highlight)
    const inInt   = INTERIOR_HOTSPOTS.some(h => h.id === highlight)
    if (inFront) setActiveTab('front_panel')
    else if (inInt) setActiveTab('interior')
    setActiveHotspot(highlight)
  }, [highlight])

  const tab       = TABS.find(t => t.id === activeTab)!
  const hotspot   = tab.hotspots.find(h => h.id === activeHotspot) ?? null

  function handlePinClick(id: string) {
    setActiveHotspot(prev => prev === id ? null : id)
  }

  const containerHeight = inline ? '260px' : '360px'

  return (
    <div className={`flex flex-col rounded-xl border border-[#1e2b3a] overflow-hidden bg-[#0e1218] ${inline ? '' : 'h-full'}`}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2b3a] flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M1 2 L10 7 L17 4 L15 8 L19 10 L15 14 L10 18 L6 14 Z"
              fill="#f0f4f8" fillOpacity="0.7" />
          </svg>
          <span className="text-[12px] font-semibold text-[#f0f4f8] tracking-[-0.01em]">
            Machine Explorer
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a2332] border border-[#243040] text-[#4a5568]">
            OmniPro 220
          </span>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-0.5 bg-[#141c24] border border-[#1e2b3a] rounded-lg p-0.5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setActiveHotspot(null) }}
              className={`
                px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors duration-100
                ${activeTab === t.id
                  ? 'bg-[#1a2332] text-[#f0f4f8]'
                  : 'text-[#4a5568] hover:text-[#8892a4]'
                }
              `}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Image + hotspots ────────────────────────────────────────────── */}
      <div
        className="relative flex-shrink-0 overflow-hidden"
        style={{ height: containerHeight, backgroundColor: tab.bgColor }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tab.image}
          alt={tab.label}
          className="w-full h-full"
          style={{ objectFit: tab.bgFit }}
        />

        {/* Dark overlay to make pins more visible */}
        <div className="absolute inset-0 bg-[#0e1218]/20 pointer-events-none" />

        {/* Hotspot pins */}
        {tab.hotspots.map(h => (
          <HotspotPin
            key={h.id}
            hotspot={h}
            active={activeHotspot === h.id}
            highlighted={highlight === h.id && activeHotspot !== h.id}
            onClick={() => handlePinClick(h.id)}
            inline={inline}
          />
        ))}

        {/* Tap-hint — only when nothing selected */}
        {!activeHotspot && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="text-[10px] text-[#4a5568] bg-[#0e1218]/70 px-2 py-1 rounded-full">
              Tap any pin to learn more
            </span>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 pointer-events-none">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#f0f4f8]/20 border border-[#f0f4f8]" />
            <span className="text-[9px] text-[#4a5568]">critical</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#8892a4]/15 border border-[#8892a4]" />
            <span className="text-[9px] text-[#4a5568]">important</span>
          </div>
        </div>
      </div>

      {/* ── Detail panel ────────────────────────────────────────────────── */}
      {hotspot && (
        <DetailPanel hotspot={hotspot} onClose={() => setActiveHotspot(null)} />
      )}

      {/* ── Footer — hotspot list (collapsed, shows count) ─────────────── */}
      {!hotspot && (
        <div className="px-4 py-2 border-t border-[#1e2b3a] flex-shrink-0">
          <div className="flex flex-wrap gap-1">
            {tab.hotspots.map(h => (
              <button
                key={h.id}
                onClick={() => setActiveHotspot(h.id)}
                className={`
                  text-[10px] px-2 py-0.5 rounded border transition-colors duration-100
                  ${h.importance === 'critical'
                    ? 'border-[#243040] text-[#8892a4] hover:border-[#f0f4f8]/30 hover:text-[#f0f4f8]'
                    : 'border-[#1e2b3a] text-[#4a5568] hover:border-[#243040] hover:text-[#8892a4]'
                  }
                `}
              >
                {h.shortLabel}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Full-page wrapper (used in sidebar view)
// ─────────────────────────────────────────────────────────────────────────────

export function MachineExplorerPage({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[#1e2b3a] flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[#8892a4] hover:text-[#f0f4f8] transition-colors text-[12px]"
        >
          <Zap size={11} />
          Back to chat
        </button>
        <div className="h-3.5 w-px bg-[#1e2b3a]" />
        <span className="text-[13px] font-semibold text-[#f0f4f8] tracking-[-0.01em]">
          Machine Explorer
        </span>
        <span className="text-[11px] text-[#4a5568]">interactive diagram</span>
      </div>

      {/* Explorer fills remaining space */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5">
        <MachineExplorer inline={false} />
      </div>
    </div>
  )
}
