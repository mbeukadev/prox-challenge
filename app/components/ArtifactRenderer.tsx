'use client'

import dynamic from 'next/dynamic'

// Lazy-load heavy artifact components so they don't bloat the initial bundle
const DutyCycleCalculator      = dynamic(() => import('./artifacts/DutyCycleCalculator'))
const PolarityConfigurator     = dynamic(() => import('./artifacts/PolarityConfigurator'))
const TroubleshootingChecklist = dynamic(() => import('./artifacts/TroubleshootingChecklist'))
const MachineExplorer          = dynamic(() => import('./MachineExplorer'))

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ArtifactResult {
  artifact_type: string
  render: true
  title?: string
  initialProcess?: string
  initialVoltage?: string
  tab?: string
  highlight?: string
  data?: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────────────────────
// Renderer
// ─────────────────────────────────────────────────────────────────────────────

export default function ArtifactRenderer({ artifact }: { artifact: ArtifactResult }) {
  switch (artifact.artifact_type) {
    case 'duty_cycle_calculator':
      return (
        <DutyCycleCalculator
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data={artifact.data as any}
          initialProcess={artifact.initialProcess}
          initialVoltage={artifact.initialVoltage}
        />
      )

    case 'polarity_configurator':
      return (
        <PolarityConfigurator
          initialProcess={artifact.initialProcess}
        />
      )

    case 'troubleshooting_checklist':
      return (
        <TroubleshootingChecklist
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data={(artifact.data as any) ?? {}}
        />
      )

    case 'machine_explorer':
      return (
        <MachineExplorer
          highlight={artifact.highlight}
          initialTab={artifact.tab as 'front_panel' | 'interior' | undefined}
          inline={true}
        />
      )

    default:
      return (
        <div className="rounded-lg border border-[#1e2b3a] bg-[#141c24] px-4 py-3 text-[11px] text-[#4a5568]">
          Unknown artifact type: {artifact.artifact_type}
        </div>
      )
  }
}
