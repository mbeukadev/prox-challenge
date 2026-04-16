# Vulcan OmniPro 220 — Welding Assistant

An AI-powered welding technician for the Harbor Freight Vulcan OmniPro 220 multiprocess welder (model 57812). Built as a Prox founding engineer challenge submission.

---

## What it does

Ask anything about the OmniPro 220 — duty cycles, polarity setup, troubleshooting, wire sizes, gas requirements — and the agent answers with exact numbers pulled from a structured knowledge base, not from model memory. It supports all four welding processes: MIG (GMAW), Flux-Cored (FCAW), TIG (GTAW), and Stick (SMAW).

**Key capabilities:**
- Exact spec lookups (duty cycles, amperage ranges, wire sizes) via tool calls
- Step-by-step setup procedures for each process
- Symptom-based troubleshooting with ranked causes and solutions
- Manual page diagrams rendered as inline images with fullscreen modal
- Interactive artifacts: duty cycle clock diagram, polarity cable configurator, troubleshooting checklist
- Vision: upload a weld photo and Claude analyzes visible defects
- Mobile-responsive with PWA support (add to home screen)

---

## Architecture

```
app/
  page.tsx                    # Sidebar layout, mobile responsive shell
  layout.tsx                  # Root layout, PWA meta tags, viewport
  globals.css                 # Tailwind base + message content styles
  api/
    chat/route.ts             # Streaming agentic loop (SSE)
  components/
    ChatInterface.tsx         # Main chat UI — messages, input, image upload
    ImageViewer.tsx           # Thumbnail + fullscreen modal for manual pages
    ArtifactRenderer.tsx      # Dispatches to the right artifact component
    artifacts/
      DutyCycleCalculator.tsx # SVG clock diagram, process × voltage selectors
      PolarityConfigurator.tsx # SVG front-panel cable diagram
      TroubleshootingChecklist.tsx # Interactive per-item checklist
lib/
  knowledge.ts                # All tool implementations — queries JSON files
  tools.ts                    # Anthropic Tool definitions + dispatcher
knowledge/
  specs.json                  # Duty cycles, amperage ranges, wire sizes, polarity
  procedures.json             # Step-by-step setup for each process
  troubleshooting.json        # Problem → causes → solutions
  image-references.json       # Manual page metadata
public/
  manual-pages/               # 36 PNG scans of the OmniPro 220 manual
  product.webp                # Product photo
  manifest.json               # PWA manifest
```

**Agentic loop** (`app/api/chat/route.ts`):
The route runs a streaming tool-use loop using `client.messages.stream()`. On each iteration it collects `input_json_delta` events to accumulate tool input JSON, then executes all tools synchronously, pushes tool results back into the conversation, and recurses up to 8 times until the model stops with `end_turn`. All events are streamed to the client as newline-delimited SSE JSON.

**Tool protocol** — Five tools are wired:
| Tool | Purpose |
|---|---|
| `lookup_specs` | Duty cycles, amperage ranges, wire sizes, polarity, gas, materials |
| `get_procedure` | Step-by-step cable setup, wire loading, gas hookup, settings |
| `troubleshoot` | Keyword-scored symptom matching → top 3 causes + solutions |
| `get_image` | Returns a manual page path for inline rendering |
| `generate_artifact` | Bundles data for interactive React components |

**Knowledge base** — Structured JSON files in `knowledge/`. All tool functions query these files directly. No RAG, no embeddings — exact lookups with keyword scoring for troubleshooting. Claude is instructed never to state specifications from memory; every number comes through a tool call.

---

## How to run

```bash
git clone <repo-url>
cd prox-challenge
npm install

# Add your Anthropic API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

npm run dev
# Open http://localhost:3000
```

Requires Node 18+. Uses `claude-haiku-4-5-20251001` by default (fast, low cost). Swap the model in `app/api/chat/route.ts` to use Sonnet or Opus for higher accuracy.

---

## Knowledge base

The `knowledge/` directory contains four JSON files derived from the OmniPro 220 owner's manual:

- **`specs.json`** — Duty cycles at every amperage for each process × voltage combination. Amperage ranges, supported wire sizes, polarity settings, shielding gas requirements, weldable materials.
- **`procedures.json`** — Ordered steps for cable setup, wire loading, gas hookup, machine settings, and welding technique for MIG, Flux-Cored, TIG, and Stick.
- **`troubleshooting.json`** — 20+ problems with symptom descriptions, multiple ranked causes, and specific solutions. Covers bird's nesting, porosity, spatter, arc instability, burn-through, machine not powering on, and more.
- **`image-references.json`** — Metadata for 36 manual page scans: page number, description, category. Used to select the right diagram when `get_image` is called.

---

## Future directions

**Voice AI** — Replace the text input with real-time voice using the Anthropic streaming API + Web Speech API. A welder's hands are often gloved or dirty; voice interaction is the natural interface for the shop floor.

**Camera-based weld analysis** — Extend the vision pipeline to continuous video frames. Point your phone at a weld bead and get live feedback on bead width, undercut, spatter, and color (which indicates heat input). This turns the assistant from reactive to proactive.

**Machine telemetry integration** — The OmniPro 220 doesn't expose a data port, but next-gen machines do. Pairing live amperage, voltage, and wire-feed-speed data with the knowledge base would enable automatic duty cycle warnings and weld parameter logging.

**Offline mode** — Bundle the knowledge base into a service worker and cache responses. The shop Wi-Fi is often unreliable; the core spec lookups should work without a connection.

**Multi-machine support** — The tool and knowledge architecture is machine-agnostic. A `machine_id` parameter on each tool call + a registry of JSON knowledge bases would extend coverage to any welder with a digitized manual.
