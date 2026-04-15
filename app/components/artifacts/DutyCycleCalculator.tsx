'use client'

import { useState, useMemo } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DutyCycleEntry {
  percent: number
  amperage: number
  weld_minutes?: number
  rest_minutes?: number
}

interface VoltageSpec {
  duty_cycles: DutyCycleEntry[]
  range?: string
}

interface ProcessSpec {
  '120V': VoltageSpec
  '240V': VoltageSpec
}

interface DutyCycleData {
  allDutyCycles: Record<string, ProcessSpec>
  explanation?: { definition?: string }
}

interface DutyCycleCalculatorProps {
  data: DutyCycleData
  initialProcess?: string
  initialVoltage?: string
}

type Process = 'MIG' | 'Flux-Cored' | 'TIG' | 'Stick'
type Voltage = '120V' | '240V'

const PROCESSES: Process[] = ['MIG', 'Flux-Cored', 'TIG', 'Stick']
const VOLTAGES: Voltage[] = ['120V', '240V']

// ─────────────────────────────────────────────────────────────────────────────
// Clock SVG
// ─────────────────────────────────────────────────────────────────────────────

function DutyCycleClock({ entry }: { entry: DutyCycleEntry }) {
  const percent    = entry.percent
  const weldMin    = entry.weld_minutes ?? (percent / 10)
  const restMin    = entry.rest_minutes ?? (10 - weldMin)

  const R             = 72
  const CX            = 90
  const CY            = 90
  const circumference = 2 * Math.PI * R
  const weldArc       = (percent / 100) * circumference
  const strokeW       = 14

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 180 180" width="160" height="160" aria-label={`Duty cycle: ${percent}%`}>
        {/* Background circle */}
        <circle cx={CX} cy={CY} r={R + strokeW / 2 + 4} fill="#0e1218" />

        <g transform={`rotate(-90 ${CX} ${CY})`}>
          {/* Track (rest time) */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="#1e2b3a"
            strokeWidth={strokeW}
          />
          {/* Weld arc (teal) */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="#5eead4"
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={`${weldArc} ${circumference - weldArc}`}
            style={{ transition: 'stroke-dasharray 0.4s ease' }}
          />
        </g>

        {/* Center text — NOT rotated */}
        <text
          x={CX} y={CY - 10}
          textAnchor="middle"
          fill="#f0f4f8"
          fontSize="26"
          fontWeight="600"
          fontFamily="Inter, sans-serif"
        >
          {percent}%
        </text>
        <text
          x={CX} y={CY + 9}
          textAnchor="middle"
          fill="#8892a4"
          fontSize="10.5"
          fontFamily="Inter, sans-serif"
        >
          {entry.amperage}A
        </text>

        {/* 10-min label */}
        <text
          x={CX} y={CY + 26}
          textAnchor="middle"
          fill="#4a5568"
          fontSize="9"
          fontFamily="Inter, sans-serif"
        >
          per 10 min cycle
        </text>
      </svg>

      {/* Weld / Rest legend */}
      <div className="flex items-center gap-5 text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#5eead4]" />
          <span className="text-[#c4cdd8] font-medium">{weldMin} min</span>
          <span className="text-[#4a5568]">weld</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1e2b3a]" />
          <span className="text-[#c4cdd8] font-medium">{restMin} min</span>
          <span className="text-[#4a5568]">rest</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Amperage selector pills
// ─────────────────────────────────────────────────────────────────────────────

function AmperagePills({
  entries,
  selected,
  onSelect,
}: {
  entries: DutyCycleEntry[]
  selected: number
  onSelect: (i: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {entries.map((e, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`
            px-3 py-1.5 rounded text-[11px] font-medium border transition-colors
            ${selected === i
              ? 'bg-[#1a3a38] border-[#5eead4] text-[#5eead4]'
              : 'bg-[#141c24] border-[#1e2b3a] text-[#8892a4] hover:border-[#243040] hover:text-[#c4cdd8]'
            }
          `}
        >
          {e.amperage}A · {e.percent}%
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function DutyCycleCalculator({
  data,
  initialProcess = 'MIG',
  initialVoltage = '240V',
}: DutyCycleCalculatorProps) {
  const [process, setProcess] = useState<Process>(initialProcess as Process)
  const [voltage, setVoltage]  = useState<Voltage>(initialVoltage as Voltage)
  const [entryIdx, setEntryIdx] = useState(0)

  const voltageSpec = useMemo(() => {
    return data.allDutyCycles?.[process]?.[voltage]
  }, [data, process, voltage])

  const entries = voltageSpec?.duty_cycles ?? []
  const selected = entries[Math.min(entryIdx, entries.length - 1)]

  // Reset entry index when process/voltage changes
  const handleProcess = (p: Process) => { setProcess(p); setEntryIdx(0) }
  const handleVoltage = (v: Voltage) => { setVoltage(v); setEntryIdx(0) }

  if (!selected) return (
    <div className="text-[12px] text-[#4a5568] px-4 py-3">
      No duty cycle data available for {process} at {voltage}.
    </div>
  )

  return (
    <div className="rounded-xl border border-[#1e2b3a] bg-[#0e1218] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2b3a]">
        <span className="text-[11px] font-semibold text-[#8892a4] uppercase tracking-wider">
          Duty Cycle Calculator
        </span>
        <span className="text-[10px] text-[#4a5568]">Vulcan OmniPro 220</span>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Process + Voltage selectors */}
        <div className="flex gap-2">
          {/* Process */}
          <div className="flex-1">
            <p className="text-[10px] text-[#4a5568] mb-1.5 uppercase tracking-wider">Process</p>
            <div className="grid grid-cols-2 gap-1">
              {PROCESSES.map((p) => (
                <button
                  key={p}
                  onClick={() => handleProcess(p)}
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
          </div>

          {/* Voltage */}
          <div className="w-28">
            <p className="text-[10px] text-[#4a5568] mb-1.5 uppercase tracking-wider">Voltage</p>
            <div className="flex flex-col gap-1">
              {VOLTAGES.map((v) => (
                <button
                  key={v}
                  onClick={() => handleVoltage(v)}
                  className={`
                    py-1.5 rounded text-[11px] font-medium border transition-colors
                    ${voltage === v
                      ? 'bg-[#1a2332] border-[#243040] text-[#f0f4f8]'
                      : 'bg-transparent border-[#1e2b3a] text-[#4a5568] hover:text-[#8892a4]'
                    }
                  `}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Amperage selector */}
        <div>
          <p className="text-[10px] text-[#4a5568] mb-1.5 uppercase tracking-wider">Amperage</p>
          <AmperagePills
            entries={entries}
            selected={entryIdx}
            onSelect={setEntryIdx}
          />
        </div>

        {/* Clock */}
        <div className="flex justify-center py-2">
          <DutyCycleClock entry={selected} />
        </div>

        {/* Amperage range footnote */}
        {voltageSpec?.range && (
          <p className="text-center text-[10px] text-[#4a5568]">
            Welding range: {voltageSpec.range}
          </p>
        )}
      </div>
    </div>
  )
}
