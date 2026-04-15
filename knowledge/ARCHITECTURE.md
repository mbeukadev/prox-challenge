# Prox Challenge — Architecture Plan
## Vulcan OmniPro 220 Multimodal Reasoning Agent

## Overview

The agent uses a **structured knowledge base** (not raw RAG) with four distinct
modules the LLM queries via tool use. This ensures exact numbers from specs,
correct polarity per process, and accurate troubleshooting — no hallucination
on safety-critical welding data.

---

## Knowledge Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Claude Agent SDK                   │
│                                                      │
│  System Prompt: Vulcan OmniPro 220 expert persona   │
│  + Manual page images loaded via vision              │
│                                                      │
│  Tools:                                              │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │ lookup_specs  │  │ get_procedure│                 │
│  │              │  │              │                  │
│  │ Exact duty   │  │ Step-by-step │                 │
│  │ cycles,      │  │ setup keyed  │                 │
│  │ amperage     │  │ by process   │                 │
│  │ ranges,      │  │ type         │                 │
│  │ wire sizes   │  │              │                 │
│  └──────────────┘  └──────────────┘                 │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │ troubleshoot │  │ get_image    │                 │
│  │              │  │              │                 │
│  │ Symptom →    │  │ Returns      │                 │
│  │ cause/       │  │ manual page  │                 │
│  │ solution     │  │ image or     │                 │
│  │ pairs        │  │ product      │                 │
│  │              │  │ photo        │                 │
│  └──────────────┘  └──────────────┘                 │
│                                                      │
│  Artifact Generation:                                │
│  When answer is best shown visually, generate:       │
│  - React component (calculator, flowchart)           │
│  - SVG diagram (polarity setup, weld angles)         │
│  - Image reference (manual page screenshot)          │
└─────────────────────────────────────────────────────┘
```

---

## Tool Definitions

### 1. `lookup_specs`
**Input:** process (MIG|Flux-Cored|TIG|Stick), voltage (120V|240V), query_type (duty_cycle|amperage_range|wire_sizes|polarity|gas|materials)
**Returns:** Exact structured data from specs.json
**Why:** Duty cycle questions are the #1 test. Wrong numbers = instant fail.

### 2. `get_procedure`
**Input:** process (MIG|Flux-Cored|TIG|Stick), section (cable_setup|wire_setup|gas_setup|settings|welding_technique)
**Returns:** Step-by-step procedure with polarity config from procedures.json
**Why:** Setup procedures differ per process. Polarity confusion (DCEP vs DCEN) is the most common user error.

### 3. `troubleshoot`
**Input:** symptom (free text or keyword), process (optional)
**Returns:** Matching cause-solution pairs from troubleshooting.json
**Why:** Cross-references multiple manual sections automatically. "Porosity in flux-cored welds" needs polarity check + wire cleanliness + technique — all in one response.

### 4. `get_image`
**Input:** image_id (from image-references.json)
**Returns:** Image file path or manual page reference
**Why:** Some answers only make sense visually (wiring schematic, weld diagnosis photos, cable setup diagrams).

---

## Artifact Strategy

The agent generates interactive artifacts when the answer is better shown than described:

| Question Type | Artifact Type | Example |
|---|---|---|
| Duty cycle query | React calculator | Circular clock showing weld/rest split |
| Polarity/cable setup | SVG diagram | Front panel with colored cables in sockets |
| "Which process should I use?" | Interactive form | Step-by-step selector → recommendation |
| Troubleshooting | Interactive flowchart | Click through causes → solutions |
| Weld diagnosis | Visual comparison | Side-by-side good vs bad with corrections |
| Settings recommendation | Settings card | Process + material → voltage + wire speed |

The artifact rendering mirrors Claude's artifact system — React components
rendered in an iframe sandbox, same pattern as claude.ai artifacts.

---

## Tech Stack

```
Frontend:     Next.js 14 (App Router)
UI:           Chat interface with artifact rendering panel
Backend:      API routes calling Claude Agent SDK
Knowledge:    Pre-extracted JSON (specs, procedures, troubleshooting, images)
Images:       Manual pages pre-rasterized as PNG for Claude vision
Styling:      Tailwind CSS
Hosting:      Vercel (live URL for zero-friction evaluation)
```

---

## File Structure

```
prox-challenge/
├── .env.example              # ANTHROPIC_API_KEY=your-api-key-here
├── README.md                 # Architecture explanation + run instructions
├── package.json
├── next.config.js
│
├── knowledge/                # Structured knowledge base
│   ├── specs.json            # Exact specifications and duty cycles
│   ├── procedures.json       # Setup procedures keyed by process
│   ├── troubleshooting.json  # Symptom → cause/solution matrices
│   └── image-references.json # Manual page metadata and image mapping
│
├── files/                    # Original manual files (from challenge repo)
│   ├── owner-manual.pdf
│   ├── quick-start-guide.pdf
│   └── selection-chart.pdf
│
├── public/
│   ├── product.webp
│   ├── product-inside.webp
│   └── manual-pages/        # Pre-rasterized manual pages as PNG
│       ├── page-07-specs.png
│       ├── page-08-front-controls.png
│       ├── page-09-interior-controls.png
│       ├── page-13-dcen-flux-polarity.png
│       ├── page-14-dcep-mig-polarity.png
│       ├── page-22-welding-angles.png
│       ├── page-24-tig-setup.png
│       ├── page-27-stick-setup.png
│       ├── page-35-weld-diagnosis-wire.png
│       ├── page-38-weld-diagnosis-stick.png
│       ├── page-45-wiring-schematic.png
│       └── selection-chart.png
│
├── app/
│   ├── layout.tsx            # Root layout with fonts, metadata
│   ├── page.tsx              # Main chat interface
│   │
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # Agent SDK endpoint with tool definitions
│   │
│   └── components/
│       ├── ChatInterface.tsx  # Message list + input
│       ├── MessageBubble.tsx  # Text + artifact rendering
│       ├── ArtifactRenderer.tsx  # Sandboxed React/SVG rendering
│       └── ImageViewer.tsx    # Manual page image display
│
└── lib/
    ├── agent.ts              # Claude Agent SDK setup + tools
    ├── knowledge.ts          # Knowledge base loaders
    └── artifacts.ts          # Artifact code extraction + sandboxing
```

---

## What Makes This Submission Stand Out

1. **Structured knowledge, not RAG** — No vector store, no chunking, no
   retrieval noise. Exact data served via tools. When someone asks about
   duty cycles, the agent calls `lookup_specs` and gets the exact number,
   not a "relevant paragraph" that might contain the number.

2. **Generated visual artifacts** — Not just text answers with static images
   attached. Interactive React components rendered inline: calculators,
   flowcharts, SVG diagrams of cable setups. This is literally what Prox's
   product does ("code generation as a primitive").

3. **Visual knowledge from manual pages** — Critical diagrams (weld diagnosis
   photos, wiring schematic, polarity setups) are served as manual page
   images, not described in text. The agent knows WHEN to show an image
   vs. generate a diagram vs. give text.

4. **Domain knowledge from the video** — The agent knows things the manual
   doesn't say: real setup times per process, that synergetic presets work
   well, that 6010 rod compatibility is unclear, that MIG requires a roller
   change from knurled to V-groove when switching from flux-core.

5. **Hosted live** — Zero friction for evaluators. Click the URL, ask questions.

---

## Sample Interactions

**Q: "What's the duty cycle for MIG welding at 200A on 240V?"**
→ Tool call: `lookup_specs(process="MIG", voltage="240V", query_type="duty_cycle")`
→ Answer: "25% at 200A — that's 2.5 minutes welding, 7.5 minutes resting per 10-minute cycle."
→ Artifact: Circular clock diagram showing the 2.5/7.5 split visually.

**Q: "What polarity setup do I need for TIG welding?"**
→ Tool call: `get_procedure(process="TIG", section="cable_setup")`
→ Answer: "DCEN — Ground clamp goes to the Positive (+) socket, TIG torch goes to the Negative (-) socket."
→ Artifact: SVG diagram of front panel with green cable going to + socket, purple cable going to - socket.
→ Image: Quick-start guide page 2 (TIG cable setup photo).

**Q: "I'm getting porosity in my flux-cored welds. What should I check?"**
→ Tool call: `troubleshoot(symptom="porosity", process="Flux-Cored")`
→ Tool call: `lookup_specs(process="Flux-Cored", query_type="polarity")`
→ Answer: Synthesized response covering the 6 possible causes, with #1 being polarity check (must be DCEN for flux-cored).
→ Artifact: Interactive troubleshooting checklist the user can work through.
→ Image: Weld diagnosis page showing porosity photo.
