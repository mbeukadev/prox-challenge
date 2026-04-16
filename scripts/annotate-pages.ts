/**
 * annotate-pages.ts
 * Runs all 36 manual page images through Claude vision and produces
 * structured per-page annotations in knowledge/page-annotations.json.
 *
 * Usage: npx tsx scripts/annotate-pages.ts
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'

// Load .env so the script picks up ANTHROPIC_API_KEY without needing dotenv
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length && !key.startsWith('#')) {
      process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '')
    }
  }
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Schema ──────────────────────────────────────────────────────────────────

interface Region {
  position: string
  content: string
  type: 'diagram' | 'table' | 'text' | 'warning' | 'photo' | 'callout'
  key_values?: Record<string, string>
}

interface PageAnnotation {
  file: string
  page?: number
  label: string
  summary: string
  regions: Region[]
  warnings: string[]
  key_numbers: Record<string, string>
  spatial_guide: string
}

// ─── Page manifest (mirrors ManualGallery.tsx) ────────────────────────────────

const PAGES = [
  { file: 'quick-start-page-1.png',               label: 'Quick Start Guide (1)',           page: undefined },
  { file: 'quick-start-page-2.png',               label: 'Quick Start Guide (2)',           page: undefined },
  { file: 'selection-chart.png',                  label: 'Process Selection Chart',         page: undefined },
  { file: 'page-07-specs.png',                    label: 'Specifications',                  page: 7  },
  { file: 'page-08-front-panel-controls.png',     label: 'Front Panel Controls',            page: 8  },
  { file: 'page-09-interior-controls.png',        label: 'Interior Controls',               page: 9  },
  { file: 'page-10-wire-spool-setup.png',         label: 'Wire Spool Setup',                page: 10 },
  { file: 'page-12-feed-roller.png',              label: 'Feed Roller Types',               page: 12 },
  { file: 'page-13-dcen-flux-polarity.png',       label: 'DCEN Polarity (Flux-Cored)',      page: 13 },
  { file: 'page-14-dcep-mig-polarity-gas.png',    label: 'DCEP Polarity + Gas (MIG)',       page: 14 },
  { file: 'page-15-wire-threading.png',           label: 'Wire Threading',                  page: 15 },
  { file: 'page-18-basic-wire-welding.png',       label: 'Basic Wire Welding',              page: 18 },
  { file: 'page-19-duty-cycle-mig.png',           label: 'Duty Cycle — MIG',                page: 19 },
  { file: 'page-20-settings-lcd.png',             label: 'Settings LCD Display',            page: 20 },
  { file: 'page-21-optional-settings.png',        label: 'Optional Settings',               page: 21 },
  { file: 'page-22-welding-angles-technique.png', label: 'Welding Angles & Technique',      page: 22 },
  { file: 'page-24-tig-setup-cables.png',         label: 'TIG Cable Setup',                 page: 24 },
  { file: 'page-25-tig-gas-setup.png',            label: 'TIG Gas Setup',                   page: 25 },
  { file: 'page-26-tig-torch-assembly-grinding.png', label: 'TIG Torch Assembly & Grinding', page: 26 },
  { file: 'page-27-stick-setup-cables.png',       label: 'Stick Cable Setup',               page: 27 },
  { file: 'page-29-duty-cycle-tig-stick.png',     label: 'Duty Cycle — TIG & Stick',        page: 29 },
  { file: 'page-30-tig-welding-settings.png',     label: 'TIG Welding Settings',            page: 30 },
  { file: 'page-32-stick-welding-settings.png',   label: 'Stick Welding Settings',          page: 32 },
  { file: 'page-35-weld-diagnosis-wire.png',      label: 'Weld Diagnosis — Wire',           page: 35 },
  { file: 'page-36-wire-penetration.png',         label: 'Wire Penetration Guide',          page: 36 },
  { file: 'page-37-wire-porosity-spatter.png',    label: 'Wire Porosity & Spatter',         page: 37 },
  { file: 'page-38-weld-diagnosis-stick.png',     label: 'Weld Diagnosis — Stick',          page: 38 },
  { file: 'page-39-stick-penetration.png',        label: 'Stick Penetration Guide',         page: 39 },
  { file: 'page-40-stick-porosity-spatter.png',   label: 'Stick Porosity & Spatter',        page: 40 },
  { file: 'page-41-maintenance.png',              label: 'Maintenance',                     page: 41 },
  { file: 'page-42-troubleshoot-wire-1.png',      label: 'Troubleshooting — Wire (1)',       page: 42 },
  { file: 'page-43-troubleshoot-wire-2.png',      label: 'Troubleshooting — Wire (2)',       page: 43 },
  { file: 'page-44-troubleshoot-tig-stick.png',   label: 'Troubleshooting — TIG & Stick',   page: 44 },
  { file: 'page-45-wiring-schematic.png',         label: 'Wiring Schematic',                page: 45 },
  { file: 'page-46-parts-list.png',               label: 'Parts List',                      page: 46 },
  { file: 'page-47-assembly-diagram.png',         label: 'Assembly Diagram',                page: 47 },
]

// ─── Vision extraction prompt ─────────────────────────────────────────────────

const EXTRACTION_PROMPT = `You are analyzing a page from the Vulcan OmniPro 220 multiprocess welder owner's manual.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "summary": "1-2 sentence plain-English summary of what this page covers and why a welder would need it",
  "regions": [
    {
      "position": "top|top_left|top_right|center|bottom|bottom_left|bottom_right|full",
      "content": "what is shown/described in this region — be specific about numbers, labels, and layout",
      "type": "diagram|table|text|warning|photo|callout",
      "key_values": {"spec or label": "value or description"}
    }
  ],
  "warnings": ["exact text or close paraphrase of any safety warnings, cautions, or notes on this page"],
  "key_numbers": {
    "spec_name": "value with units"
  },
  "spatial_guide": "Natural language directions telling someone exactly WHERE on this page to find specific information. E.g. 'Duty cycle percentages are in the table in the upper-center. The thermal protection note is at the bottom in a shaded box. The 200A row is the first data row in the table.'"
}

Be precise about spatial locations. A welder may be wearing gloves and need to know exactly where to look.`

// ─── Annotate one page ────────────────────────────────────────────────────────

async function annotatePage(
  file: string,
  label: string,
  page: number | undefined,
  imageDir: string,
): Promise<PageAnnotation> {
  const imgPath = path.join(imageDir, file)
  const imgData = fs.readFileSync(imgPath)
  const base64  = imgData.toString('base64')

  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type:   'image',
            source: { type: 'base64', media_type: 'image/png', data: base64 },
          },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  // Strip any accidental markdown fences
  const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  let parsed: Omit<PageAnnotation, 'file' | 'page' | 'label'>
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    console.error(`  ⚠ JSON parse failed for ${file}. Raw:\n${raw.slice(0, 300)}`)
    parsed = {
      summary:       `Manual page: ${label}`,
      regions:       [],
      warnings:      [],
      key_numbers:   {},
      spatial_guide: 'Could not extract spatial information.',
    }
  }

  return { file, page, label, ...parsed }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const imageDir  = path.join(process.cwd(), 'public', 'manual-pages')
  const outputPath = path.join(process.cwd(), 'knowledge', 'page-annotations.json')

  // Load existing annotations so we can skip already-processed pages
  let existing: Record<string, PageAnnotation> = {}
  if (fs.existsSync(outputPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'))
      console.log(`Resuming — ${Object.keys(existing).length} pages already annotated`)
    } catch {
      console.log('Could not parse existing annotations, starting fresh')
    }
  }

  const results: Record<string, PageAnnotation> = { ...existing }
  let processed = 0
  let skipped   = 0

  for (const p of PAGES) {
    if (existing[p.file]) {
      console.log(`  ✓ skip  ${p.file}`)
      skipped++
      continue
    }

    process.stdout.write(`  ◌ annotating ${p.file} ...`)

    try {
      const annotation = await annotatePage(p.file, p.label, p.page, imageDir)
      results[p.file] = annotation
      processed++
      console.log(' done')

      // Write incrementally so a crash doesn't lose progress
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 500))
    } catch (err) {
      console.error(` ERROR: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  console.log(`\n✅ Done. ${processed} annotated, ${skipped} skipped.`)
  console.log(`   Output: ${outputPath}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
