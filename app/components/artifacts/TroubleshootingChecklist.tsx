'use client'

import { useState } from 'react'
import { CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CauseSolution {
  cause: string
  solution: string
}

interface TroubleshootResult {
  symptom: string
  applies_to?: string[]
  section?: string
  causes_and_solutions: CauseSolution[]
}

interface TroubleshootingChecklistProps {
  data: {
    symptom?: string
    process?: string
    causes?: CauseSolution[]
    results?: TroubleshootResult[]
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual checklist item
// ─────────────────────────────────────────────────────────────────────────────

function CheckItem({
  index,
  cause,
  solution,
}: {
  index: number
  cause: string
  solution: string
}) {
  const [checked, setChecked] = useState(false)
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`rounded-lg border transition-colors ${
      checked
        ? 'border-[#1e2b3a] bg-[#0e1218] opacity-50'
        : 'border-[#1e2b3a] bg-[#141c24]'
    }`}>
      <div className="flex items-start gap-3 px-3 py-2.5">
        {/* Checkbox */}
        <button
          onClick={() => setChecked(!checked)}
          className="mt-0.5 flex-shrink-0 text-[#4a5568] hover:text-[#f0f4f8] transition-colors"
          aria-label={checked ? 'Mark unchecked' : 'Mark checked'}
        >
          {checked
            ? <CheckSquare size={14} className="text-[#22c55e]" />
            : <Square size={14} />
          }
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-1.5">
              <span className="text-[10px] font-semibold text-[#4a5568] mt-0.5 shrink-0 w-4">
                {index}.
              </span>
              <p className={`text-[12px] font-medium leading-snug ${
                checked ? 'line-through text-[#4a5568]' : 'text-[#c4cdd8]'
              }`}>
                {cause}
              </p>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="shrink-0 text-[#4a5568] hover:text-[#8892a4] transition-colors"
              aria-label="Toggle solution"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {/* Solution (expanded) */}
          {expanded && (
            <div className="mt-2 ml-5 pl-2 border-l border-[#1e2b3a]">
              <p className="text-[11px] text-[#8892a4] leading-relaxed">{solution}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function TroubleshootingChecklist({ data }: TroubleshootingChecklistProps) {
  // Flatten data — handle both the flat `causes` array and the nested `results` array
  const allItems: CauseSolution[] = data.causes
    ?? data.results?.flatMap((r) => r.causes_and_solutions)
    ?? []

  const symptom  = data.symptom  ?? 'Welding problem'
  const process  = data.process  ?? ''

  const [allExpanded, setAllExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-[#1e2b3a] bg-[#0e1218] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2b3a]">
        <span className="text-[11px] font-semibold text-[#8892a4] uppercase tracking-wider">
          Troubleshooting Checklist
        </span>
        <button
          onClick={() => setAllExpanded(!allExpanded)}
          className="text-[10px] text-[#4a5568] hover:text-[#8892a4] transition-colors"
        >
          {allExpanded ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Symptom */}
        <div className="flex items-start gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444] mt-1.5 shrink-0" />
          <div>
            <p className="text-[11px] text-[#4a5568] uppercase tracking-wider">Symptom</p>
            <p className="text-[13px] font-medium text-[#f0f4f8] capitalize mt-0.5">{symptom}</p>
            {process && process !== 'all' && (
              <span className="inline-block mt-1 text-[10px] text-[#f0f4f8] bg-[#1a2332] border border-[#243040] rounded px-1.5 py-0.5">
                {process}
              </span>
            )}
          </div>
        </div>

        {/* Items */}
        {allItems.length === 0 ? (
          <p className="text-[12px] text-[#4a5568] text-center py-4">No checklist items available.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] text-[#4a5568] uppercase tracking-wider">
              Check each cause — click to expand the fix, check when resolved
            </p>
            {allItems.map((item, i) => (
              <CheckItem
                key={i}
                index={i + 1}
                cause={item.cause}
                solution={item.solution}
              />
            ))}
          </div>
        )}

        {/* Footer note */}
        <p className="text-[10px] text-[#4a5568] text-center">
          Work through causes in order — the first is usually the culprit
        </p>
      </div>
    </div>
  )
}
