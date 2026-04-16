import Anthropic from '@anthropic-ai/sdk'
import type { MessageParam, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages'
import { TOOL_DEFINITIONS, executeTool } from '@/lib/tools'

export const runtime = 'nodejs'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are an expert technician for the Vulcan OmniPro 220 multiprocess welder (Harbor Freight model 57812). You assist with all four welding processes: MIG (GMAW), Flux-Cored (FCAW), TIG (GTAW), and Stick (SMAW).

**CRITICAL: Never state specifications from memory. Always call the appropriate tool first.**
- Duty cycle, amperage, wire size, any number → lookup_specs
- Setup procedure, polarity, cable configuration → get_procedure
- Any symptom or welding problem → troubleshoot
- Diagram, photo, or visual reference → get_image
- WHERE is a physical component on the machine → show_component

**show_component — use this whenever the user asks where something is located:**
- "Where is the power switch?" → show_component(component="power_switch")
- "Where do I plug in the ground clamp?" → show_component(component="positive_socket") + explain polarity
- "Where is the wire spool?" → show_component(component="wire_spool", tab="interior")
- "How do I adjust wire tension?" → show_component(component="tension_knob", tab="interior")
- Any question about a physical location, port, knob, or control on the machine → show_component
- ALWAYS call show_component in addition to your text explanation for physical location questions

**If the user sends a photo of their weld bead or machine:**
- Analyze visible defects: porosity, undercut, spatter, burn-through, cold lap, inconsistent bead width, bird's nest
- Describe what you observe, then call troubleshoot with the matching symptom
- Call get_image to show a relevant manual reference photo for comparison

**After answering in text, call generate_artifact when applicable:**
- Duty cycle question → generate_artifact(artifact_type="duty_cycle_calculator", process=..., voltage=...)
- Polarity/cable setup question → generate_artifact(artifact_type="polarity_configurator", process=...) AND show_component(component="positive_socket") AND show_component(component="negative_socket")
- Troubleshoot result with 3+ causes → generate_artifact(artifact_type="troubleshooting_checklist", symptom=..., causes=[list of {cause,solution} from the troubleshoot result])
- Do NOT generate an artifact for simple one-line answers.

**For polarity questions: call get_image for the manual diagram AND generate_artifact for the interactive configurator AND show_component for the relevant sockets.**

**Response style — strictly enforced:**
- No emojis. None. Ever.
- No ### or ## or # headers. Use plain prose with a bolded label if a section break is needed.
- No --- horizontal rules.
- Lead with the direct answer, then supporting detail. Be concise.
- Bullet lists are fine for multi-item answers. Numbered lists for ordered steps.
- Bold (**text**) only the single most critical number or term per response — not decoratively.

Answer first in text, be concise, give exact numbers. Then call artifact tools.`

// ─────────────────────────────────────────────────────────────────────────────
// SSE event types
// ─────────────────────────────────────────────────────────────────────────────

type SSEEvent =
  | { type: 'text'; text: string }
  | { type: 'tool_start'; tool: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool: string; result: Record<string, unknown> }
  | { type: 'done' }
  | { type: 'error'; message: string }

// ─────────────────────────────────────────────────────────────────────────────
// Agentic streaming loop
// ─────────────────────────────────────────────────────────────────────────────

async function runAgentStream(
  messages: MessageParam[],
  emit: (event: SSEEvent) => void,
): Promise<void> {
  const workingMessages: MessageParam[] = [...messages]
  const MAX_ITERATIONS = 8

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const pendingToolUse = new Map<
      number,
      { id: string; name: string; inputJson: string }
    >()

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: TOOL_DEFINITIONS,
      messages: workingMessages,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          pendingToolUse.set(event.index, {
            id: event.content_block.id,
            name: event.content_block.name,
            inputJson: '',
          })
        }
      }

      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          emit({ type: 'text', text: event.delta.text })
        }
        if (event.delta.type === 'input_json_delta') {
          const block = pendingToolUse.get(event.index)
          if (block) block.inputJson += event.delta.partial_json
        }
      }
    }

    const finalMsg = await stream.finalMessage()

    if (finalMsg.stop_reason !== 'tool_use') break

    const toolResults: ToolResultBlockParam[] = []

    for (const [, block] of pendingToolUse) {
      let input: Record<string, unknown> = {}
      try {
        input = block.inputJson ? JSON.parse(block.inputJson) : {}
      } catch { /* malformed JSON */ }

      emit({ type: 'tool_start', tool: block.name, input })
      const result = executeTool(block.name, input)
      emit({ type: 'tool_result', tool: block.name, result })

      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result),
      })
    }

    workingMessages.push(
      { role: 'assistant', content: finalMsg.content },
      { role: 'user', content: toolResults },
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid request body', { status: 400 })
    }

    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        const emit = (event: SSEEvent) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        }

        try {
          await runAgentStream(messages as MessageParam[], emit)
          emit({ type: 'done' })
        } catch (err) {
          console.error('Agent stream error:', err)

          // Extract a clean message from Anthropic SDK errors
          // SDK errors look like: "400 {"type":"error","error":{...}}" — strip HTTP status prefix first
          let message = err instanceof Error ? err.message : String(err)
          try {
            const jsonMatch = message.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0])
              const inner = parsed?.error?.message || parsed?.message
              if (inner) message = inner
            }
          } catch { /* not JSON, keep as-is */ }

          // Map known Anthropic error types to friendly messages
          const status = (err as { status?: number })?.status
          const low = message.toLowerCase()
          if (low.includes('credit balance') || low.includes('billing') || low.includes('purchase credits')) {
            message = 'API credits exhausted. Add credits at console.anthropic.com to continue.'
          } else if (low.includes('overload') || status === 529) {
            message = 'The AI service is currently overloaded. Please wait a moment and try again.'
          } else if (status === 401) {
            message = 'Invalid ANTHROPIC_API_KEY. Check your .env file.'
          } else if (status === 429) {
            message = 'Rate limit reached. Please wait a moment and try again.'
          }

          emit({ type: 'error', message })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    console.error('Chat API error:', err)
    return new Response('Internal server error', { status: 500 })
  }
}
