'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import {
  Database,
  FileText,
  Wrench,
  ImageIcon,
  BarChart2,
  Zap,
  ArrowRight,
  Check,
  ChevronRight,
} from 'lucide-react'
import ImageViewer from './ImageViewer'
import ArtifactRenderer, { type ArtifactResult } from './ArtifactRenderer'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ToolCall {
  tool: string
  input: Record<string, unknown>
  result?: Record<string, unknown>
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCall[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool metadata
// ─────────────────────────────────────────────────────────────────────────────

const TOOL_META: Record<string, { label: string; icon: React.ReactNode }> = {
  lookup_specs:      { label: 'Specs lookup',    icon: <Database size={10} /> },
  get_procedure:     { label: 'Procedure',       icon: <FileText size={10} /> },
  troubleshoot:      { label: 'Troubleshoot',    icon: <Wrench size={10} /> },
  get_image:         { label: 'Manual page',     icon: <ImageIcon size={10} /> },
  generate_artifact: { label: 'Generating visual', icon: <BarChart2 size={10} /> },
}

// ─────────────────────────────────────────────────────────────────────────────
// Derive images and artifacts from a message's toolCalls
// ─────────────────────────────────────────────────────────────────────────────

interface ImageData {
  file_path: string
  description: string
  manual_page?: number
}

function extractImages(toolCalls: ToolCall[]): ImageData[] {
  return toolCalls
    .filter((tc) => tc.tool === 'get_image' && tc.result?.display === true && tc.result?.file_path)
    .map((tc) => ({
      file_path:   tc.result!.file_path as string,
      description: tc.result!.description as string,
      manual_page: tc.result!.manual_page as number | undefined,
    }))
}

function extractArtifacts(toolCalls: ToolCall[]): ArtifactResult[] {
  return toolCalls
    .filter((tc) => tc.tool === 'generate_artifact' && tc.result?.render === true && tc.result?.artifact_type)
    .map((tc) => tc.result as unknown as ArtifactResult)
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool badge (compact pill)
// ─────────────────────────────────────────────────────────────────────────────

function ToolBadge({ call, loading }: { call: ToolCall; loading?: boolean }) {
  const meta     = TOOL_META[call.tool] ?? { label: call.tool, icon: <Database size={10} /> }
  const hasError = call.result && 'error' in call.result

  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium leading-none
      ${loading   ? 'bg-[#1a2332] border-[#243040] text-[#8892a4]'
      : hasError  ? 'bg-[#2a1a1a] border-[#3a2020] text-[#f87171]'
      : 'bg-[#1a2332] border-[#243040] text-[#8892a4]'}
    `}>
      <span className={loading ? 'opacity-50' : ''}>{meta.icon}</span>
      <span>{meta.label}</span>
      {loading
        ? <span className="w-2 h-2 rounded-full border border-[#4a5568] border-t-[#5eead4] animate-spin ml-0.5" />
        : hasError
          ? <span className="text-[#f87171] ml-0.5">!</span>
          : <Check size={8} className="text-[#5eead4] ml-0.5" />
      }
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown renderer
// ─────────────────────────────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />')
    .replace(/^(.+)$/, '<p>$1</p>')
}

// ─────────────────────────────────────────────────────────────────────────────
// Suggested questions
// ─────────────────────────────────────────────────────────────────────────────

const SUGGESTED = [
  { label: 'Duty cycle at 200A',     prompt: "What's the duty cycle for MIG at 200A on 240V?" },
  { label: 'Flux-cored polarity',    prompt: 'How do I set up polarity for flux-cored welding?' },
  { label: 'Porosity causes',        prompt: "I'm getting porosity in my welds — what should I check?" },
  { label: 'Wire size for 1/4"',     prompt: 'What wire size should I use for 1/4" mild steel?' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Message bubble
// ─────────────────────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  activeTool,
}: {
  message: Message
  activeTool?: string
}) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[68%] bg-[#141c24] border border-[#1e2b3a] rounded-xl rounded-tr-sm px-4 py-2.5">
          <p className="text-[13px] text-[#f0f4f8] leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    )
  }

  // ── Extract images and artifacts from completed tool calls ──
  const images    = message.toolCalls ? extractImages(message.toolCalls)    : []
  const artifacts = message.toolCalls ? extractArtifacts(message.toolCalls) : []

  return (
    <div className="flex gap-3 items-start">
      {/* Sparkle avatar */}
      <div className="flex-shrink-0 w-6 h-6 rounded bg-[#1a3a38] border border-[#243040] flex items-center justify-center mt-0.5">
        <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
          <path d="M10 1 L11.5 8.5 L19 10 L11.5 11.5 L10 19 L8.5 11.5 L1 10 L8.5 8.5 Z"
            fill="#5eead4" fillOpacity="0.85" />
        </svg>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* Tool badges */}
        {((message.toolCalls && message.toolCalls.length > 0) || activeTool) && (
          <div className="flex flex-wrap gap-1">
            {message.toolCalls?.map((tc, i) => <ToolBadge key={i} call={tc} />)}
            {activeTool && <ToolBadge call={{ tool: activeTool, input: {} }} loading />}
          </div>
        )}

        {/* Text content */}
        {message.content === '' ? (
          <div className="flex items-center gap-2 py-1">
            {activeTool ? (
              <span className="text-[12px] text-[#4a5568] italic">Analyzing results...</span>
            ) : (
              <>
                <span className="w-1 h-1 rounded-full bg-[#4a5568] animate-pulse" />
                <span className="w-1 h-1 rounded-full bg-[#4a5568] animate-pulse [animation-delay:150ms]" />
                <span className="w-1 h-1 rounded-full bg-[#4a5568] animate-pulse [animation-delay:300ms]" />
              </>
            )}
          </div>
        ) : (
          <div
            className="message-content text-[13px] text-[#c4cdd8] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        )}

        {/* ── Manual page images ─────────────────────────────────────────── */}
        {images.length > 0 && (
          <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {images.map((img, i) => (
              <ImageViewer
                key={i}
                path={img.file_path}
                description={img.description}
                manualPage={img.manual_page}
              />
            ))}
          </div>
        )}

        {/* ── Interactive artifacts ──────────────────────────────────────── */}
        {artifacts.length > 0 && (
          <div className="flex flex-col gap-3">
            {artifacts.map((artifact, i) => (
              <ArtifactRenderer key={i} artifact={artifact} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ onSelect }: { onSelect: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
            <path d="M10 1 L11.5 8.5 L19 10 L11.5 11.5 L10 19 L8.5 11.5 L1 10 L8.5 8.5 Z"
              fill="#f0f4f8" fillOpacity="0.7" />
            <path d="M10 4 L10.8 8.8 L15.5 10 L10.8 11.2 L10 16 L9.2 11.2 L4.5 10 L9.2 8.8 Z"
              fill="#0e1218" />
          </svg>
          <span className="text-[18px] font-medium text-[#f0f4f8] tracking-[-0.01em]">
            Vulcan OmniPro 220
          </span>
        </div>
        <p className="text-[13px] text-[#4a5568] max-w-xs leading-relaxed">
          Ask about specs, polarity setup, troubleshooting, or welding procedures.
          Answers pull from structured knowledge — not guesses.
        </p>
        {/* Feature pills */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {[
            { icon: <Database size={9} />, label: 'Exact specs' },
            { icon: <Zap size={9} />,      label: 'Polarity diagrams' },
            { icon: <ImageIcon size={9} />, label: 'Manual pages' },
            { icon: <BarChart2 size={9} />, label: 'Interactive visuals' },
          ].map((f) => (
            <span key={f.label}
              className="inline-flex items-center gap-1 text-[10px] text-[#4a5568] bg-[#141c24] border border-[#1e2b3a] rounded-full px-2 py-0.5">
              {f.icon}<span>{f.label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full max-w-md">
        {SUGGESTED.map((s) => (
          <button key={s.label} onClick={() => onSelect(s.prompt)}
            className="group text-left px-3.5 py-3 rounded-lg bg-[#141c24] border border-[#1e2b3a]
              hover:border-[#243040] hover:bg-[#1a2332] transition-colors duration-100">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[12px] font-medium text-[#8892a4] group-hover:text-[#c4cdd8] leading-snug transition-colors">
                {s.label}
              </span>
              <ChevronRight size={12} className="text-[#2d3f52] group-hover:text-[#4a5568] mt-0.5 flex-shrink-0 transition-colors" />
            </div>
            <p className="text-[11px] text-[#4a5568] mt-1 leading-snug line-clamp-2">{s.prompt}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatInterface() {
  const [messages,   setMessages]   = useState<Message[]>([])
  const [input,      setInput]      = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [activeTool, setActiveTool] = useState<string | undefined>()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeTool])

  useEffect(() => {
    const ta = inputRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [input])

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text.trim() }
    const asstMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '', toolCalls: [] }

    const history = [...messages, userMsg]
    setMessages([...history, asstMsg])
    setInput('')
    setIsStreaming(true)
    setActiveTool(undefined)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok || !res.body) throw new Error(`API error ${res.status}`)

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      let pendingInput: Record<string, unknown> = {}

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          let evt: Record<string, unknown>
          try { evt = JSON.parse(raw) } catch { continue }

          if (evt.type === 'text') {
            setActiveTool(undefined)
            setMessages((prev) => {
              const next = [...prev]
              const last = next[next.length - 1]
              if (last?.role === 'assistant')
                next[next.length - 1] = { ...last, content: last.content + (evt.text as string) }
              return next
            })
          }

          if (evt.type === 'tool_start') {
            pendingInput = (evt.input as Record<string, unknown>) ?? {}
            setActiveTool(evt.tool as string)
          }

          if (evt.type === 'tool_result') {
            const finished: ToolCall = {
              tool:   evt.tool as string,
              input:  pendingInput,
              result: evt.result as Record<string, unknown>,
            }
            pendingInput = {}
            setActiveTool(undefined)
            setMessages((prev) => {
              const next = [...prev]
              const last = next[next.length - 1]
              if (last?.role === 'assistant')
                next[next.length - 1] = {
                  ...last,
                  toolCalls: [...(last.toolCalls ?? []), finished],
                }
              return next
            })
          }

          if (evt.type === 'error') {
            setMessages((prev) => {
              const next = [...prev]
              const last = next[next.length - 1]
              if (last?.role === 'assistant' && last.content === '')
                next[next.length - 1] = { ...last, content: `Error: ${evt.message as string}` }
              return next
            })
          }
        }
      }
    } catch (err) {
      console.error(err)
      setMessages((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last?.role === 'assistant' && last.content === '')
          next[next.length - 1] = {
            ...last,
            content: 'Connection error. Check your ANTHROPIC_API_KEY and try again.',
          }
        return next
      })
    } finally {
      setIsStreaming(false)
      setActiveTool(undefined)
    }
  }

  function handleSubmit(e: FormEvent) { e.preventDefault(); sendMessage(input) }
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const lastAsstId = [...messages].reverse().find((m) => m.role === 'assistant')?.id

  return (
    <div className="flex flex-col h-full">

      {/* ── Messages ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {messages.length === 0
          ? <EmptyState onSelect={sendMessage} />
          : messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              activeTool={msg.id === lastAsstId && isStreaming ? activeTool : undefined}
            />
          ))
        }
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ──────────────────────────────────────────────────────── */}
      <div className="px-5 pb-5 pt-2">
        <form onSubmit={handleSubmit}
          className="flex items-end gap-2 bg-[#141c24] border border-[#1e2b3a] rounded-xl px-4 py-3 focus-within:border-[#243040] transition-colors duration-100">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about specs, setup, or troubleshooting..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-transparent resize-none outline-none text-[13px] text-[#f0f4f8] placeholder-[#4a5568] leading-relaxed max-h-40"
          />
          <button type="submit" disabled={!input.trim() || isStreaming}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-[#1a3a38] border border-[#243040] text-[#5eead4] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1e4440] hover:border-[#5eead4] transition-colors duration-100">
            {isStreaming
              ? <span className="w-3 h-3 rounded-full border border-[#243040] border-t-[#5eead4] animate-spin" />
              : <ArrowRight size={13} />
            }
          </button>
        </form>

        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-[10px] text-[#2d3f52]">Enter to send · Shift+Enter for new line</span>
          <span className="text-[10px] text-[#2d3f52]">
            {isStreaming
              ? <span className="text-[#4a5568]">{activeTool ? `Running ${activeTool}...` : 'Generating...'}</span>
              : '5 tools active'
            }
          </span>
        </div>
      </div>
    </div>
  )
}
