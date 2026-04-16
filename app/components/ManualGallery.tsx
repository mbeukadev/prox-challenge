'use client'

import { ArrowLeft } from 'lucide-react'
import ImageViewer from './ImageViewer'

// ─────────────────────────────────────────────────────────────────────────────
// All 36 manual page images with human-readable labels
// ─────────────────────────────────────────────────────────────────────────────

const PAGES = [
  { file: 'quick-start-page-1.png',              label: 'Quick Start Guide (1)',          page: undefined },
  { file: 'quick-start-page-2.png',              label: 'Quick Start Guide (2)',          page: undefined },
  { file: 'selection-chart.png',                 label: 'Process Selection Chart',        page: undefined },
  { file: 'page-07-specs.png',                   label: 'Specifications',                 page: 7  },
  { file: 'page-08-front-panel-controls.png',    label: 'Front Panel Controls',           page: 8  },
  { file: 'page-09-interior-controls.png',       label: 'Interior Controls',              page: 9  },
  { file: 'page-10-wire-spool-setup.png',        label: 'Wire Spool Setup',               page: 10 },
  { file: 'page-12-feed-roller.png',             label: 'Feed Roller Types',              page: 12 },
  { file: 'page-13-dcen-flux-polarity.png',      label: 'DCEN Polarity (Flux-Cored)',     page: 13 },
  { file: 'page-14-dcep-mig-polarity-gas.png',   label: 'DCEP Polarity + Gas (MIG)',      page: 14 },
  { file: 'page-15-wire-threading.png',          label: 'Wire Threading',                 page: 15 },
  { file: 'page-18-basic-wire-welding.png',      label: 'Basic Wire Welding',             page: 18 },
  { file: 'page-19-duty-cycle-mig.png',          label: 'Duty Cycle — MIG',               page: 19 },
  { file: 'page-20-settings-lcd.png',            label: 'Settings LCD Display',           page: 20 },
  { file: 'page-21-optional-settings.png',       label: 'Optional Settings',              page: 21 },
  { file: 'page-22-welding-angles-technique.png',label: 'Welding Angles & Technique',     page: 22 },
  { file: 'page-24-tig-setup-cables.png',        label: 'TIG Cable Setup',                page: 24 },
  { file: 'page-25-tig-gas-setup.png',           label: 'TIG Gas Setup',                  page: 25 },
  { file: 'page-26-tig-torch-assembly-grinding.png', label: 'TIG Torch Assembly & Grinding', page: 26 },
  { file: 'page-27-stick-setup-cables.png',      label: 'Stick Cable Setup',              page: 27 },
  { file: 'page-29-duty-cycle-tig-stick.png',    label: 'Duty Cycle — TIG & Stick',       page: 29 },
  { file: 'page-30-tig-welding-settings.png',    label: 'TIG Welding Settings',           page: 30 },
  { file: 'page-32-stick-welding-settings.png',  label: 'Stick Welding Settings',         page: 32 },
  { file: 'page-35-weld-diagnosis-wire.png',     label: 'Weld Diagnosis — Wire',          page: 35 },
  { file: 'page-36-wire-penetration.png',        label: 'Wire Penetration Guide',         page: 36 },
  { file: 'page-37-wire-porosity-spatter.png',   label: 'Wire Porosity & Spatter',        page: 37 },
  { file: 'page-38-weld-diagnosis-stick.png',    label: 'Weld Diagnosis — Stick',         page: 38 },
  { file: 'page-39-stick-penetration.png',       label: 'Stick Penetration Guide',        page: 39 },
  { file: 'page-40-stick-porosity-spatter.png',  label: 'Stick Porosity & Spatter',       page: 40 },
  { file: 'page-41-maintenance.png',             label: 'Maintenance',                    page: 41 },
  { file: 'page-42-troubleshoot-wire-1.png',     label: 'Troubleshooting — Wire (1)',      page: 42 },
  { file: 'page-43-troubleshoot-wire-2.png',     label: 'Troubleshooting — Wire (2)',      page: 43 },
  { file: 'page-44-troubleshoot-tig-stick.png',  label: 'Troubleshooting — TIG & Stick',  page: 44 },
  { file: 'page-45-wiring-schematic.png',        label: 'Wiring Schematic',               page: 45 },
  { file: 'page-46-parts-list.png',              label: 'Parts List',                     page: 46 },
  { file: 'page-47-assembly-diagram.png',        label: 'Assembly Diagram',               page: 47 },
]

// ─────────────────────────────────────────────────────────────────────────────
// Gallery
// ─────────────────────────────────────────────────────────────────────────────

export default function ManualGallery({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[#1e2b3a] flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[#8892a4] hover:text-[#f0f4f8] transition-colors text-[12px]"
        >
          <ArrowLeft size={13} />
          Back to chat
        </button>
        <div className="h-3.5 w-px bg-[#1e2b3a]" />
        <span className="text-[13px] font-semibold text-[#f0f4f8] tracking-[-0.01em]">
          Manual Pages
        </span>
        <span className="text-[11px] text-[#4a5568]">{PAGES.length} pages</span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {PAGES.map((p) => (
            <ImageViewer
              key={p.file}
              path={`/manual-pages/${p.file}`}
              description={p.label}
              manualPage={p.page}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
