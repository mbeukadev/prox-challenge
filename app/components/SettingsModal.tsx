'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

const SYSTEM_INFO = [
  { label: 'Model',              value: 'claude-sonnet-4-6',  note: 'Anthropic' },
  { label: 'Tools active',       value: '6',                  note: 'lookup_specs · get_procedure · troubleshoot · get_image · show_component · generate_artifact' },
  { label: 'Knowledge modules',  value: '9',                  note: '4 process specs · 4 procedure sets · 1 troubleshooting DB' },
  { label: 'Manual pages',       value: '36',                 note: 'Harbor Freight #57812 owner\'s manual' },
]

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0a0d10]/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative w-full max-w-xs rounded-xl border border-[#1e2b3a] bg-[#141c24] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2b3a]">
          <div>
            <p className="text-[13px] font-semibold text-[#f0f4f8] tracking-[-0.01em]">System Info</p>
            <p className="text-[10px] text-[#4a5568] mt-0.5">Read-only · Vulcan OmniPro 220</p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded text-[#4a5568] hover:text-[#f0f4f8] hover:bg-[#1e2b3a] transition-colors"
            aria-label="Close"
          >
            <X size={13} />
          </button>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#1e2b3a]">
          {SYSTEM_INFO.map(({ label, value, note }) => (
            <div key={label} className="px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12px] text-[#8892a4]">{label}</span>
                <span className="text-[12px] font-semibold text-[#f0f4f8] tabular-nums">{value}</span>
              </div>
              <p className="text-[10px] text-[#4a5568] mt-0.5 leading-relaxed">{note}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#1e2b3a] bg-[#0e1218]">
          <p className="text-[10px] text-[#2d3f52] text-center">
            All answers sourced from structured knowledge — not model memory
          </p>
        </div>
      </div>
    </div>
  )
}
