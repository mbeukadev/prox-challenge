'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Static polarity data — no need to load from JSON for this component
// ─────────────────────────────────────────────────────────────────────────────

type Process = 'MIG' | 'Flux-Cored' | 'TIG' | 'Stick'

interface PolConfig {
  polarity:       string
  polarity_name:  string
  ground_socket:  'positive' | 'negative'
  work_socket:    'positive' | 'negative'
  work_label:     string
  gas_required:   boolean
  gas_type:       string | null
  note:           string
}

const POLARITY_CONFIG: Record<Process, PolConfig> = {
  'MIG': {
    polarity:      'DCEP (Direct Current Electrode Positive)',
    polarity_name: 'DCEP',
    ground_socket: 'negative',
    work_socket:   'positive',
    work_label:    'Wire Feed Power Cable',
    gas_required:  true,
    gas_type:      'C25 (75% Argon / 25% CO₂)',
    note:          'Ground → (−)  ·  Wire Feed Power → (+)',
  },
  'Flux-Cored': {
    polarity:      'DCEN (Direct Current Electrode Negative)',
    polarity_name: 'DCEN',
    ground_socket: 'positive',
    work_socket:   'negative',
    work_label:    'Wire Feed Power Cable',
    gas_required:  false,
    gas_type:      null,
    note:          'REVERSED vs MIG  ·  Ground → (+)  ·  Wire Feed → (−)',
  },
  'TIG': {
    polarity:      'DCEN (Direct Current Electrode Negative)',
    polarity_name: 'DCEN',
    ground_socket: 'positive',
    work_socket:   'negative',
    work_label:    'TIG Torch Cable',
    gas_required:  true,
    gas_type:      '100% Argon',
    note:          'Ground → (+)  ·  TIG Torch → (−)',
  },
  'Stick': {
    polarity:      'DCEP (Direct Current Electrode Positive)',
    polarity_name: 'DCEP',
    ground_socket: 'negative',
    work_socket:   'positive',
    work_label:    'Electrode Holder Cable',
    gas_required:  false,
    gas_type:      null,
    note:          'Ground → (−)  ·  Electrode Holder → (+)',
  },
}

const PROCESSES: Process[] = ['MIG', 'Flux-Cored', 'TIG', 'Stick']

// Cable colors
const GROUND_COLOR = '#ef4444'   // red
const WORK_COLOR   = '#3b82f6'   // blue

// ─────────────────────────────────────────────────────────────────────────────
// Panel SVG
// ─────────────────────────────────────────────────────────────────────────────

function PanelSVG({ config }: { config: PolConfig }) {
  const negX  = 80   // (−) socket center X
  const posX  = 160  // (+) socket center X
  const migX  = 40   // MIG gun socket center X
  const sockY = 60   // socket center Y
  const sockR = 16   // socket radius

  const groundX = config.ground_socket === 'negative' ? negX : posX
  const workX   = config.work_socket   === 'negative' ? negX : posX

  // Cable paths — cubic bezier from socket going down/up
  const groundPath = `M ${groundX} ${sockY + sockR}
    C ${groundX} ${sockY + 80} ${groundX - 20} ${sockY + 100} ${groundX - 30} ${sockY + 120}`

  const workPath = `M ${workX} ${sockY + sockR}
    C ${workX} ${sockY + 80} ${workX + 20} ${sockY + 100} ${workX + 30} ${sockY + 120}`

  return (
    <svg viewBox="0 0 240 165" width="100%" aria-label="Polarity cable diagram">
      {/* Panel outline */}
      <rect x="10" y="10" width="220" height="95" rx="8"
        fill="#141c24" stroke="#1e2b3a" strokeWidth="1.5" />

      {/* Panel label */}
      <text x="120" y="30" textAnchor="middle" fill="#4a5568" fontSize="9" fontFamily="Inter,sans-serif">
        VULCAN OMNIPRO 220 — FRONT PANEL
      </text>

      {/* ── MIG gun socket (always stays, just label changes) ── */}
      <circle cx={migX} cy={sockY} r={sockR} fill="#0e1218" stroke="#2d3f52" strokeWidth="1.5" />
      <text x={migX} y={sockY + 1} textAnchor="middle" dominantBaseline="middle"
        fill="#4a5568" fontSize="8" fontFamily="Inter,sans-serif" fontWeight="600">MIG</text>
      <text x={migX} y={sockY + 27} textAnchor="middle"
        fill="#4a5568" fontSize="7.5" fontFamily="Inter,sans-serif">Gun</text>

      {/* ── (−) socket ── */}
      <circle cx={negX} cy={sockY} r={sockR} fill="#0e1218"
        stroke={config.ground_socket === 'negative' ? GROUND_COLOR : config.work_socket === 'negative' ? WORK_COLOR : '#2d3f52'}
        strokeWidth="2" />
      <text x={negX} y={sockY + 1} textAnchor="middle" dominantBaseline="middle"
        fill="#c4cdd8" fontSize="13" fontFamily="Inter,sans-serif" fontWeight="700">−</text>
      <text x={negX} y={sockY + 27} textAnchor="middle"
        fill="#8892a4" fontSize="7.5" fontFamily="Inter,sans-serif">Negative</text>

      {/* ── (+) socket ── */}
      <circle cx={posX} cy={sockY} r={sockR} fill="#0e1218"
        stroke={config.ground_socket === 'positive' ? GROUND_COLOR : config.work_socket === 'positive' ? WORK_COLOR : '#2d3f52'}
        strokeWidth="2" />
      <text x={posX} y={sockY + 1} textAnchor="middle" dominantBaseline="middle"
        fill="#c4cdd8" fontSize="13" fontFamily="Inter,sans-serif" fontWeight="700">+</text>
      <text x={posX} y={sockY + 27} textAnchor="middle"
        fill="#8892a4" fontSize="7.5" fontFamily="Inter,sans-serif">Positive</text>

      {/* ── Ground cable (red) ── */}
      <path d={groundPath} fill="none" stroke={GROUND_COLOR}
        strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
      {/* Ground label at end of cable */}
      <text x={groundX - 30} y={sockY + 138} textAnchor="middle"
        fill={GROUND_COLOR} fontSize="8" fontFamily="Inter,sans-serif" fontWeight="600">Ground</text>

      {/* ── Work cable (blue) ── */}
      <path d={workPath} fill="none" stroke={WORK_COLOR}
        strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
      {/* Work label at end of cable */}
      <text x={workX + 30} y={sockY + 138} textAnchor="middle"
        fill={WORK_COLOR} fontSize="8" fontFamily="Inter,sans-serif" fontWeight="600">
        {config.work_label.replace(' Cable', '')}
      </text>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface PolarityConfiguratorProps {
  initialProcess?: string
}

export default function PolarityConfigurator({ initialProcess = 'MIG' }: PolarityConfiguratorProps) {
  const [process, setProcess] = useState<Process>(initialProcess as Process)
  const config = POLARITY_CONFIG[process]

  return (
    <div className="rounded-xl border border-[#1e2b3a] bg-[#0e1218] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2b3a]">
        <span className="text-[11px] font-semibold text-[#8892a4] uppercase tracking-wider">
          Polarity Configurator
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#f0f4f8] bg-[#1a2332] border border-[#2d3f52] rounded px-1.5 py-0.5">
          {config.polarity_name}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Process selector */}
        <div className="grid grid-cols-4 gap-1">
          {PROCESSES.map((p) => (
            <button
              key={p}
              onClick={() => setProcess(p)}
              className={`
                py-1.5 rounded text-[11px] font-medium border transition-colors
                ${process === p
                  ? 'bg-[#1a2332] border-[#243040] text-[#f0f4f8]'
                  : 'bg-transparent border-[#1e2b3a] text-[#4a5568] hover:text-[#8892a4]'
                }
              `}
            >
              {p}
            </button>
          ))}
        </div>

        {/* SVG diagram */}
        <div className="px-2">
          <PanelSVG config={config} />
        </div>

        {/* Connection table */}
        <div className="rounded-lg border border-[#1e2b3a] overflow-hidden text-[11px]">
          <div className="flex items-center px-3 py-2 bg-[#141c24] border-b border-[#1e2b3a]">
            <span className="w-3 h-3 rounded-full mr-2" style={{ background: GROUND_COLOR, opacity: 0.85 }} />
            <span className="text-[#8892a4]">Ground Clamp</span>
            <span className="mx-2 text-[#4a5568]">→</span>
            <span className="font-semibold text-[#f0f4f8]">
              {config.ground_socket === 'negative' ? 'Negative (−) Socket' : 'Positive (+) Socket'}
            </span>
          </div>
          <div className="flex items-center px-3 py-2 bg-[#141c24]">
            <span className="w-3 h-3 rounded-full mr-2" style={{ background: WORK_COLOR, opacity: 0.85 }} />
            <span className="text-[#8892a4]">{config.work_label}</span>
            <span className="mx-2 text-[#4a5568]">→</span>
            <span className="font-semibold text-[#f0f4f8]">
              {config.work_socket === 'negative' ? 'Negative (−) Socket' : 'Positive (+) Socket'}
            </span>
          </div>
        </div>

        {/* Gas requirement */}
        <div className={`rounded-lg px-3 py-2 text-[11px] border ${
          config.gas_required
            ? 'bg-[#1a2332] border-[#243040] text-[#8892a4]'
            : 'bg-[#141c24] border-[#1e2b3a] text-[#4a5568]'
        }`}>
          {config.gas_required
            ? <><span className="font-semibold text-[#c4cdd8]">Gas required:</span> {config.gas_type}</>
            : <span>No shielding gas required — self-shielded</span>
          }
        </div>

        {/* Polarity note */}
        {process === 'Flux-Cored' && (
          <div className="rounded-lg px-3 py-2 text-[11px] bg-[#2a1a1a] border border-[#3a2020] text-[#fca5a5]">
            <span className="font-semibold">Warning:</span> Polarity is reversed vs MIG. Wrong polarity causes porosity and poor fusion.
          </div>
        )}
      </div>
    </div>
  )
}
