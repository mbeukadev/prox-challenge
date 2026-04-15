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

**After answering in text, call generate_artifact when applicable:**
- Duty cycle question → generate_artifact(artifact_type="duty_cycle_calculator", process=..., voltage=...)
- Polarity/cable setup question → generate_artifact(artifact_type="polarity_configurator", process=...)
- Troubleshoot result with 3+ causes → generate_artifact(artifact_type="troubleshooting_checklist", symptom=..., causes=[list of {cause,solution} from the troubleshoot result])
- Do NOT generate an artifact for simple one-line answers.

**For polarity questions: call get_image for the manual diagram AND generate_artifact for the interactive configurator.**

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
      model: 'claude-haiku-4-5-20251001',
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
          const message = err instanceof Error ? err.message : String(err)
          console.error('Agent stream error:', err)
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
