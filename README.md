# Vulcan OmniPro 220 — Welding Assistant

An AI-powered field technician for the Harbor Freight Vulcan OmniPro 220 multiprocess welder (model 57812). Built as a Prox founding engineer challenge submission.

---

## Overview

Ask anything about the OmniPro 220 and the agent answers with exact numbers drawn from a structured knowledge base — not from model memory. Covers all four welding processes: MIG (GMAW), Flux-Cored (FCAW), TIG (GTAW), and Stick (SMAW). Designed for one-handed, gloved use in an active shop environment.

**Capabilities:**
- Exact spec lookups — duty cycles, amperage ranges, wire sizes, polarity, gas requirements
- Step-by-step setup procedures for each process
- Symptom-based troubleshooting with ranked causes and solutions
- Manual page diagrams rendered inline with fullscreen zoom
- Interactive artifacts: duty cycle calculator, polarity cable configurator, troubleshooting checklist
- Machine Explorer — interactive labeled diagram of the front panel and interior
- Vision — upload or scan a weld photo for defect analysis
- Voice input (Web Speech API) and text-to-speech on assistant messages
- Mobile-responsive, PWA-installable

---

## Architecture

```
app/
  page.tsx                      # Sidebar layout, view routing, modal state
  layout.tsx                    # Root layout, PWA metadata, viewport config
  globals.css                   # Tailwind base + message content prose styles
  api/
    chat/route.ts               # Streaming agentic loop (SSE, up to 8 tool iterations)
  components/
    ChatInterface.tsx           # Chat UI — messages, voice, camera, image upload
    MachineExplorer.tsx         # Interactive hotspot diagram (front panel + interior)
    ManualGallery.tsx           # Grid browser for all 36 manual page scans
    ImageViewer.tsx             # Thumbnail + fullscreen modal
    ArtifactRenderer.tsx        # Dispatches tool results to artifact components
    MachineScannerModal.tsx     # Camera scan entry modal
    SettingsModal.tsx           # System info panel
    artifacts/
      DutyCycleCalculator.tsx   # Process × voltage selector with visual output
      PolarityConfigurator.tsx  # SVG cable diagram for all four processes
      TroubleshootingChecklist.tsx  # Interactive per-cause checklist
lib/
  knowledge.ts                  # All tool implementations — queries JSON files
  tools.ts                      # Anthropic Tool definitions + dispatcher
knowledge/
  specs.json                    # Duty cycles, amperage, wire sizes, polarity, gas
  procedures.json               # Ordered setup steps for each process
  troubleshooting.json          # Problems → causes → solutions (20+ entries)
  image-references.json         # Manual page metadata
  page-annotations.json         # AI-generated spatial annotations (36 pages)
scripts/
  annotate-pages.ts             # Preprocessing — runs all 36 manual pages through
                                #   Claude vision to extract spatial annotations
public/
  manual-pages/                 # 36 PNG scans of the OmniPro 220 owner's manual
  product.webp / product-inside.webp  # Product photos
  manifest.json                 # PWA manifest
```

---

## Agentic loop

`app/api/chat/route.ts` runs a streaming tool-use loop using `client.messages.stream()`. Each iteration accumulates `input_json_delta` events to build tool input JSON, executes all tools synchronously against the knowledge base, pushes results back into the conversation, and recurses up to 8 times until the model returns `end_turn`. Every event — text deltas, tool starts, tool results, errors — streams to the client as newline-delimited SSE.

---

## Tool protocol

Six tools are active:

| Tool | Purpose |
|---|---|
| `lookup_specs` | Duty cycles, amperage ranges, wire sizes, polarity, gas requirements, materials |
| `get_procedure` | Cable setup, wire loading, gas hookup, machine settings, welding technique |
| `troubleshoot` | Keyword-scored symptom matching — returns top 3 causes + solutions |
| `get_image` | Returns a manual page path + spatial annotation for inline rendering |
| `show_component` | Opens the Machine Explorer and highlights a specific component |
| `generate_artifact` | Bundles structured data for interactive React components |

---

## Knowledge base

All tool functions query static JSON files in `knowledge/`. No RAG, no embeddings — exact lookups with keyword scoring for troubleshooting. The model is instructed never to state specifications from memory; every number comes through a tool call.

- **`specs.json`** — Duty cycles at every amperage for all process × voltage combinations. Amperage ranges, wire sizes, polarity, shielding gas, weldable materials.
- **`procedures.json`** — Ordered steps for cable setup, wire loading, gas hookup, machine settings, and welding technique for all four processes.
- **`troubleshooting.json`** — 20+ problems with symptom descriptions, ranked causes, and specific solutions. Covers bird's nesting, porosity, spatter, arc instability, burn-through, thermal protection trips, and more.
- **`image-references.json`** — Metadata for 36 manual page scans used by `get_image`.
- **`page-annotations.json`** — Generated by `scripts/annotate-pages.ts`. Each page gets a summary, spatial region map, extracted key numbers, warnings, and a natural-language `spatial_guide` the assistant uses to tell the user exactly where on a page to look.

---

## Machine Explorer

`app/components/MachineExplorer.tsx` is an interactive labeled diagram with two tabs — Front Panel (13 hotspots) and Interior (5 hotspots). Each hotspot shows a description, contextual tips, and a safety callout where relevant.

It renders in two modes:
- **Inline** — as a chat artifact when the `show_component` tool fires. Ask "where's the power switch?" and the diagram opens in the message thread with that pin highlighted.
- **Full view** — accessible from the sidebar as a standalone screen.

---

## Page annotation pipeline

`scripts/annotate-pages.ts` runs all 36 manual page images through Claude's vision API and writes structured JSON annotations to `knowledge/page-annotations.json`. The script resumes from where it left off if interrupted.

```bash
npx tsx scripts/annotate-pages.ts
```

The annotations attach automatically to every `get_image` tool response, giving the assistant spatial context: "The duty cycle table is in the upper center. Row 1 is 200A = 25%. The thermal protection callout is at the bottom in a shaded box."

---

## How to run

```bash
git clone <repo-url>
cd prox-challenge
npm install

# Add your Anthropic API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# Optional: generate page annotations (uses ~36 API calls)
npx tsx scripts/annotate-pages.ts

npm run dev
# Open http://localhost:3000
```

Requires Node 18+. Model: `claude-sonnet-4-6`.

---

## Deployment

### Vercel

1. Push to GitHub
2. Import the repo in Vercel
3. Add `ANTHROPIC_API_KEY` as an environment variable
4. Deploy — no build configuration needed (Next.js auto-detected)

---

## Future directions

**Continuous weld analysis** — Extend the vision pipeline to video frames. Point a phone at a weld bead and get live feedback on bead width, undercut, spatter, and color (a proxy for heat input). Turns the assistant from reactive to proactive.

**Machine telemetry** — Next-gen machines expose live amperage, voltage, and wire-feed-speed data. Pairing that with the knowledge base enables automatic duty cycle warnings and weld parameter logging without the welder doing anything.

**Offline mode** — Bundle the knowledge base into a service worker. Shop Wi-Fi is unreliable; core spec lookups should work without a connection.

**Multi-machine support** — The tool and knowledge architecture is machine-agnostic. A `machine_id` parameter on each tool call plus a registry of JSON knowledge bases extends coverage to any welder with a digitized manual.

**Real-time voice** — Replace Web Speech API with a streaming voice model for lower latency and better noise rejection in a shop environment.
