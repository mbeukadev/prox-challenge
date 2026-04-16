'use client'

import { useState, useRef, useEffect, FormEvent, forwardRef, useImperativeHandle } from 'react'
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
  Camera,
  X,
  AlertCircle,
  Scan,
  Mic,
  Volume2,
  VolumeX,
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
  imagePreview?: string    // data URL for rendering
  imageBase64?: string     // raw base64 for API history
  imageMimeType?: string
  imageSource?: 'scan'     // set when photo came from camera capture
  toolCalls?: ToolCall[]
}

interface PendingImage {
  base64: string
  mimeType: string
  preview: string
  source?: 'scan'
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool metadata
// ─────────────────────────────────────────────────────────────────────────────

const TOOL_META: Record<string, { label: string; icon: React.ReactNode }> = {
  lookup_specs:      { label: 'Specs lookup',      icon: <Database size={10} /> },
  get_procedure:     { label: 'Procedure',         icon: <FileText size={10} /> },
  troubleshoot:      { label: 'Troubleshoot',      icon: <Wrench size={10} /> },
  get_image:         { label: 'Manual page',       icon: <ImageIcon size={10} /> },
  generate_artifact: { label: 'Generating visual', icon: <BarChart2 size={10} /> },
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
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

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[-\d]+\.? (.+)$/gm, '$1')
    .replace(/<[^>]*>/g, '')
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool badge
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
        ? <span className="w-2 h-2 rounded-full border border-[#4a5568] border-t-[#f0f4f8] animate-spin ml-0.5" />
        : hasError
          ? <span className="text-[#f87171] ml-0.5">!</span>
          : <Check size={8} className="text-[#22c55e] ml-0.5" />
      }
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown renderer
// ─────────────────────────────────────────────────────────────────────────────

// Strip emojis from a string
function stripEmoji(s: string): string {
  return s
    .replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Inline formatting only (bold, italic, code)
function inlineFmt(s: string): string {
  return stripEmoji(s)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

// Parse a pipe-delimited table row into cells, stripping leading/trailing pipes
function parseTableRow(line: string): string[] {
  return line
    .replace(/^\||\|$/g, '')
    .split('|')
    .map(c => c.trim())
}

function isTableSeparator(line: string): boolean {
  return /^\|?[\s|:-]+\|$/.test(line) && line.includes('-')
}

function renderMarkdown(text: string): string {
  const lines = stripEmoji(text).split('\n')
  const out: string[] = []
  let inUl    = false
  let inOl    = false
  let inTable = false
  let tableHeaderDone = false

  function closeList() {
    if (inUl) { out.push('</ul>');    inUl = false }
    if (inOl) { out.push('</ol>');    inOl = false }
  }
  function closeTable() {
    if (inTable) { out.push('</tbody></table>'); inTable = false; tableHeaderDone = false }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // ── Table rows ────────────────────────────────────────────────────────────
    if (line.startsWith('|') && line.endsWith('|')) {
      if (isTableSeparator(line)) {
        // This is the header separator — close thead, open tbody
        if (inTable && !tableHeaderDone) {
          out.push('</tr></thead><tbody>')
          tableHeaderDone = true
        }
        continue
      }

      const cells = parseTableRow(line)

      if (!inTable) {
        closeList()
        out.push('<table><thead><tr>')
        cells.forEach(c => out.push(`<th>${inlineFmt(c)}</th>`))
        inTable = true
        // don't push </tr> yet — wait for separator line to confirm it's a header
        continue
      }

      if (inTable && !tableHeaderDone) {
        // Second pipe row before separator — treat first row as already opened, add this as another header
        cells.forEach(c => out.push(`<th>${inlineFmt(c)}</th>`))
        continue
      }

      // Body row
      out.push('<tr>')
      cells.forEach(c => out.push(`<td>${inlineFmt(c)}</td>`))
      out.push('</tr>')
      continue
    }

    // Non-table line — close table if open
    closeTable()

    // ── Horizontal rule (must not be a table separator context) ───────────────
    if (/^---+$/.test(line)) { closeList(); out.push('<hr />'); continue }

    // ── Headers ───────────────────────────────────────────────────────────────
    const hMatch = line.match(/^#{1,3} (.+)$/)
    if (hMatch) {
      closeList()
      const size = (line.match(/^(#+)/)?.[1].length ?? 1) === 1 ? 'text-[13px]' : 'text-[12px]'
      out.push(`<p class="mt-3 mb-1 ${size} font-semibold text-[#f0f4f8]">${inlineFmt(hMatch[1])}</p>`)
      continue
    }

    // ── Unordered list ────────────────────────────────────────────────────────
    const ulMatch = line.match(/^[-*] (.+)$/)
    if (ulMatch) {
      if (!inUl) { if (inOl) { out.push('</ol>'); inOl = false } out.push('<ul>'); inUl = true }
      out.push(`<li>${inlineFmt(ulMatch[1])}</li>`)
      continue
    }

    // ── Ordered list ──────────────────────────────────────────────────────────
    const olMatch = line.match(/^\d+\. (.+)$/)
    if (olMatch) {
      if (!inOl) { if (inUl) { out.push('</ul>'); inUl = false } out.push('<ol>'); inOl = true }
      out.push(`<li>${inlineFmt(olMatch[1])}</li>`)
      continue
    }

    // ── Empty line ────────────────────────────────────────────────────────────
    if (line === '') { closeList(); out.push('<br />'); continue }

    // ── Plain text ────────────────────────────────────────────────────────────
    closeList()
    out.push(`<span>${inlineFmt(line)}</span><br />`)
  }

  closeList()
  closeTable()
  return out.join('')
}

// ─────────────────────────────────────────────────────────────────────────────
// Speaker button — reads assistant message aloud via SpeechSynthesis
// ─────────────────────────────────────────────────────────────────────────────

function SpeakerButton({ content }: { content: string }) {
  const [speaking, setSpeaking] = useState(false)

  // Don't render if TTS not available (SSR or unsupported browser)
  if (typeof window === 'undefined' || !window.speechSynthesis) return null

  function toggle() {
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    } else {
      const utterance = new SpeechSynthesisUtterance(stripMarkdown(content))
      utterance.rate = 0.92
      utterance.pitch = 1
      utterance.onend   = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utterance)
      setSpeaking(true)
    }
  }

  return (
    <button
      onClick={toggle}
      className={`
        flex-shrink-0 w-5 h-5 flex items-center justify-center rounded
        transition-colors duration-100 touch-manipulation
        ${speaking
          ? 'text-[#f0f4f8] bg-[#1a2332]'
          : 'text-[#2d3f52] hover:text-[#8892a4]'
        }
      `}
      aria-label={speaking ? 'Stop reading' : 'Read aloud'}
      title={speaking ? 'Stop reading' : 'Read aloud'}
    >
      {speaking ? <VolumeX size={11} /> : <Volume2 size={11} />}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Suggested questions
// ─────────────────────────────────────────────────────────────────────────────

const SUGGESTED = [
  { label: 'Duty cycle at 200A',  prompt: "What's the duty cycle for MIG at 200A on 240V?" },
  { label: 'Flux-cored polarity', prompt: 'How do I set up polarity for flux-cored welding?' },
  { label: 'Porosity causes',     prompt: "I'm getting porosity in my welds — what should I check?" },
  { label: 'Wire size for 1/4"',  prompt: 'What wire size should I use for 1/4" mild steel?' },
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
        <div className="max-w-[72%] bg-[#141c24] border border-[#1e2b3a] rounded-xl rounded-tr-sm overflow-hidden">
          {message.imagePreview && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.imagePreview}
                alt={message.imageSource === 'scan' ? 'Scanned image' : 'Uploaded photo'}
                className="w-full max-h-56 object-cover"
              />
              {/* Image source badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e1218] border-b border-[#1e2b3a]">
                <Camera size={9} className="text-[#4a5568]" />
                <span className="text-[10px] text-[#4a5568]">
                  {message.imageSource === 'scan' ? 'Scanned image' : 'Uploaded photo'}
                </span>
              </div>
            </>
          )}
          {message.content && (
            <p className="text-[13px] text-[#f0f4f8] leading-relaxed whitespace-pre-wrap px-4 py-2.5">
              {message.content}
            </p>
          )}
        </div>
      </div>
    )
  }

  const images    = message.toolCalls ? extractImages(message.toolCalls)    : []
  const artifacts = message.toolCalls ? extractArtifacts(message.toolCalls) : []

  return (
    <div className="flex gap-3 items-start">
      {/* Avatar */}
      <div className="flex-shrink-0 w-6 h-6 rounded bg-[#1a2332] border border-[#243040] flex items-center justify-center mt-0.5 overflow-hidden p-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vulcanlogo.png" alt="Vulcan" className="w-full h-full object-contain" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* Tool badges — show up to 3 individually, collapse the rest */}
        {((message.toolCalls && message.toolCalls.length > 0) || activeTool) && (
          <div className="flex flex-wrap gap-1 items-center">
            {(message.toolCalls ?? []).slice(0, 3).map((tc, i) => <ToolBadge key={i} call={tc} />)}
            {(message.toolCalls ?? []).length > 3 && (
              <span className="text-[10px] text-[#4a5568] px-1.5">
                +{(message.toolCalls ?? []).length - 3} more
              </span>
            )}
            {activeTool && <ToolBadge call={{ tool: activeTool, input: {} }} loading />}
          </div>
        )}

        {/* Text / loading skeleton / error */}
        {message.content === '' ? (
          <div className="py-1">
            {activeTool ? (
              <span className="text-[12px] text-[#4a5568] italic">Analyzing results...</span>
            ) : (
              <div className="flex flex-col gap-2 w-full max-w-[260px]">
                <div className="h-2.5 rounded-full bg-[#1e2b3a] animate-pulse" />
                <div className="h-2.5 rounded-full bg-[#1e2b3a] w-4/5 animate-pulse [animation-delay:80ms]" />
                <div className="h-2.5 rounded-full bg-[#1e2b3a] w-3/5 animate-pulse [animation-delay:160ms]" />
              </div>
            )}
          </div>
        ) : (message.content.startsWith('Error:') || message.content.startsWith('Connection error')) ? (
          <div className="rounded-lg border border-[#3a2020] bg-[#180f0f] px-4 py-3 flex items-start gap-3">
            <AlertCircle size={14} className="text-[#f87171] mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[#f87171]">
                {message.content.includes('ANTHROPIC_API_KEY') ? 'API Key Missing'
                  : message.content.toLowerCase().includes('overload') ? 'Service Busy'
                  : message.content.toLowerCase().includes('rate limit') ? 'Rate Limited'
                  : 'Connection Error'}
              </p>
              <p className="text-[11px] text-[#fca5a5] mt-1 leading-relaxed">
                {message.content.includes('ANTHROPIC_API_KEY')
                  ? 'Set ANTHROPIC_API_KEY in your .env file and restart the dev server.'
                  : message.content.replace(/^(Error:|Connection error\.?)\s*/i, '')
                }
              </p>
              {message.content.includes('ANTHROPIC_API_KEY') && (
                <code className="text-[10px] text-[#4a5568] mt-2 block font-mono">
                  echo &quot;ANTHROPIC_API_KEY=sk-ant-...&quot; &gt; .env
                </code>
              )}
            </div>
          </div>
        ) : (
          /* Text content row — message + speaker button */
          <div className="flex items-start gap-2 group">
            <div
              className="flex-1 message-content text-[13px] text-[#c4cdd8] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />
            {/* Speaker button — appears on hover (desktop) or always visible (mobile) */}
            <div className="opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0 mt-0.5 transition-opacity duration-150">
              <SpeakerButton content={message.content} />
            </div>
          </div>
        )}

        {/* Manual page images */}
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

        {/* Interactive artifacts */}
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
    <div className="flex flex-col items-center justify-center h-full px-5 sm:px-6 py-8">
      {/* ── Wordmark ── */}
      <div className="flex flex-col items-center gap-2 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vulcanlogo.png" alt="Vulcan" style={{ height: '36px', width: 'auto' }} />
        <span className="text-[13px] font-medium text-[#8892a4] tracking-widest uppercase">
          OmniPro 220
        </span>
      </div>

      {/* ── Subtitle ── */}
      <p className="text-[12px] text-[#4a5568] text-center max-w-[280px] leading-relaxed mb-5">
        Ask about specs, polarity, troubleshooting, or setup procedures.
        Every answer is sourced from structured knowledge.
      </p>

      {/* ── Feature pills ── */}
      <div className="hidden sm:flex items-center justify-center flex-wrap gap-1.5 mb-6">
        {[
          { icon: <Database size={9} />,  label: 'Exact specs' },
          { icon: <Zap size={9} />,       label: 'Polarity diagrams' },
          { icon: <ImageIcon size={9} />, label: 'Manual pages' },
          { icon: <BarChart2 size={9} />, label: 'Interactive visuals' },
          { icon: <Camera size={9} />,    label: 'Weld Scanner' },
        ].map((f) => (
          <span key={f.label}
            className="inline-flex items-center gap-1 text-[10px] text-[#4a5568] bg-[#141c24] border border-[#1e2b3a] rounded-full px-2 py-0.5">
            {f.icon}<span>{f.label}</span>
          </span>
        ))}
      </div>

      {/* ── Suggestion cards — strictly 2×2, equal height ── */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-[400px]">
        {SUGGESTED.map((s) => (
          <button
            key={s.label}
            onClick={() => onSelect(s.prompt)}
            className="group text-left px-3 py-3 rounded-lg bg-[#141c24] border border-[#1e2b3a]
              hover:border-[#243040] hover:bg-[#1a2332] hover:-translate-y-0.5
              hover:shadow-[0_4px_16px_rgba(0,0,0,0.4)]
              active:translate-y-0 active:bg-[#1a2332]
              transition-all duration-150 touch-manipulation
              flex flex-col justify-between min-h-[72px]"
          >
            <span className="text-[11px] font-medium text-[#8892a4] group-hover:text-[#c4cdd8] leading-snug transition-colors">
              {s.label}
            </span>
            <p className="text-[10px] text-[#4a5568] mt-1.5 leading-snug line-clamp-2">{s.prompt}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatInterfaceHandle {
  sendMessage: (text: string) => void
  openScanner: () => void
  receiveScannedImage: (base64: string, mimeType: string) => void
}

interface ChatInterfaceProps {
  onOpenScannerModal?: () => void
}

const ChatInterface = forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(function ChatInterface({ onOpenScannerModal }, ref) {
  const [messages,     setMessages]     = useState<Message[]>([])
  const [input,        setInput]        = useState('')
  const [isStreaming,  setIsStreaming]  = useState(false)
  const [activeTool,   setActiveTool]   = useState<string | undefined>()
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null)
  const [isListening,  setIsListening]  = useState(false)
  const [voiceSupported, setVoiceSupported] = useState<boolean | null>(null)

  const messagesEndRef    = useRef<HTMLDivElement>(null)
  const inputRef          = useRef<HTMLTextAreaElement>(null)
  const scanInputRef      = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef    = useRef<any>(null)
  const voiceBaseRef      = useRef('')  // text in input when voice started

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeTool])

  useEffect(() => {
    const ta = inputRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [input])

  // Check voice support + cleanup on unmount
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setVoiceSupported(!!SR)
    return () => {
      recognitionRef.current?.stop()
      window.speechSynthesis?.cancel()
    }
  }, [])

  // ── Camera scan capture ────────────────────────────────────────────────────

  function handleScanCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const [header, base64] = dataUrl.split(',')
      const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
      setPendingImage({ base64, mimeType, preview: dataUrl, source: 'scan' })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ── Voice input ────────────────────────────────────────────────────────────

  function toggleVoice() {
    if (!voiceSupported) return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SR() as any

    recognition.continuous     = true
    recognition.interimResults = true
    recognition.lang           = 'en-US'

    // Capture any text already typed before voice starts
    voiceBaseRef.current = input.trim() ? input.trim() + ' ' : ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setInput(voiceBaseRef.current + transcript)
    }

    recognition.onend   = () => { setIsListening(false); recognitionRef.current = null }
    recognition.onerror = () => { setIsListening(false); recognitionRef.current = null }

    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }

  // ── Send ───────────────────────────────────────────────────────────────────

  async function sendMessage(text: string) {
    const hasContent = text.trim() || pendingImage
    if (!hasContent || isStreaming) return

    // Stop voice if still listening
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    }

    const capturedImage = pendingImage
    setPendingImage(null)

    const userMsg: Message = {
      id:           crypto.randomUUID(),
      role:         'user',
      content:      text.trim(),
      imagePreview: capturedImage?.preview,
      imageBase64:  capturedImage?.base64,
      imageMimeType: capturedImage?.mimeType,
      imageSource:  capturedImage?.source,
    }
    const asstMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '', toolCalls: [] }

    const history = [...messages, userMsg]
    setMessages([...history, asstMsg])
    setInput('')
    setIsStreaming(true)
    setActiveTool(undefined)

    const apiMessages = history.map((m) => {
      if (m.imageBase64 && m.role === 'user') {
        return {
          role: 'user' as const,
          content: [
            {
              type: 'image' as const,
              source: {
                type: 'base64' as const,
                media_type: m.imageMimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
                data: m.imageBase64,
              },
            },
            { type: 'text' as const, text: m.content || 'Analyze this image.' },
          ],
        }
      }
      return { role: m.role, content: m.content }
    })

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: apiMessages }),
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
                next[next.length - 1] = { ...last, toolCalls: [...(last.toolCalls ?? []), finished] }
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
          next[next.length - 1] = { ...last, content: 'Connection error. Check your ANTHROPIC_API_KEY and try again.' }
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

  useImperativeHandle(ref, () => ({
    sendMessage,
    openScanner: () => scanInputRef.current?.click(),
    receiveScannedImage: (base64: string, mimeType: string) => {
      const preview = `data:${mimeType};base64,${base64}`
      setPendingImage({ base64, mimeType, preview, source: 'scan' })
    },
  }))

  const lastAsstId = [...messages].reverse().find((m) => m.role === 'assistant')?.id
  const canSend    = (!!input.trim() || !!pendingImage) && !isStreaming

  return (
    <div className="flex flex-col h-full">

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-5">
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

      {/* ── Input ────────────────────────────────────────────────────────── */}
      <div className="px-4 md:px-5 pt-2 pb-4">

        {/* Camera capture input (capture="environment" → opens rear camera on mobile) */}
        <input
          ref={scanInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleScanCapture}
        />

        <form
          onSubmit={handleSubmit}
          className="flex flex-col bg-[#141c24] border border-[#1e2b3a] rounded-xl px-4 py-3 focus-within:border-[#243040] transition-colors duration-100"
        >
          {/* Image preview */}
          {pendingImage && (
            <div className="relative mb-2 self-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingImage.preview}
                alt="Scan preview"
                className="h-20 w-auto rounded-md border border-[#243040] object-cover"
              />
              {pendingImage.source === 'scan' && (
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 py-0.5 bg-[#0e1218]/70 rounded-b-md">
                  <Camera size={8} className="text-[#8892a4]" />
                  <span className="text-[9px] text-[#8892a4]">Scanned</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setPendingImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1a2332] border border-[#243040] flex items-center justify-center hover:border-[#4a5568] transition-colors"
                aria-label="Remove image"
              >
                <X size={9} className="text-[#8892a4]" />
              </button>
            </div>
          )}

          {/* Input row */}
          <div className="flex items-end gap-1.5">

            {/* Scan button — opens Machine Scanner modal */}
            <button
              type="button"
              onClick={() => onOpenScannerModal ? onOpenScannerModal() : scanInputRef.current?.click()}
              disabled={isStreaming}
              title="Scan weld or component"
              className="flex-shrink-0 w-11 h-11 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center
                border border-[#243040] text-[#4a5568]
                disabled:opacity-30
                hover:text-[#f0f4f8] hover:border-[#2d3f52]
                active:text-[#f0f4f8] active:bg-[#1a2332]
                transition-colors duration-100 touch-manipulation"
              aria-label="Scan weld or component"
            >
              <Scan size={13} />
            </button>

            {/* Voice button */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={toggleVoice}
                disabled={isStreaming || voiceSupported === false}
                title={
                  voiceSupported === false
                    ? 'Voice not supported in this browser'
                    : isListening ? 'Stop listening' : 'Start voice input'
                }
                className={`
                  w-11 h-11 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center
                  border transition-colors duration-100 touch-manipulation
                  disabled:opacity-30 disabled:cursor-not-allowed
                  ${isListening
                    ? 'bg-[#1a2332] border-[#2d3f52] text-[#f0f4f8] animate-pulse'
                    : 'border-[#243040] text-[#4a5568] hover:text-[#f0f4f8] hover:border-[#2d3f52] active:bg-[#1a2332]'
                  }
                `}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                aria-pressed={isListening}
              >
                <Mic size={13} />
              </button>
            </div>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? 'Listening...'
                  : 'Ask a question or scan a weld photo...'
              }
              rows={1}
              disabled={isStreaming}
              className={`
                flex-1 bg-transparent resize-none outline-none
                text-base sm:text-[13px] leading-relaxed max-h-40
                text-[#f0f4f8] placeholder-[#4a5568]
                ${isListening ? 'placeholder-[#8892a4]' : ''}
              `}
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={!canSend}
              className="flex-shrink-0 w-11 h-11 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center
                bg-[#1a2332] border border-[#243040] text-[#f0f4f8]
                disabled:opacity-25 disabled:cursor-not-allowed
                hover:bg-[#243040] hover:border-[#2d3f52]
                active:bg-[#243040]
                transition-colors duration-100 touch-manipulation"
            >
              {isStreaming
                ? <span className="w-3 h-3 rounded-full border border-[#243040] border-t-[#f0f4f8] animate-spin" />
                : <ArrowRight size={13} />
              }
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-[10px] text-[#2d3f52] hidden sm:inline">Enter to send · Shift+Enter for new line</span>
          <span className="text-[10px] text-[#2d3f52] sm:hidden">
            {isListening ? <span className="text-[#8892a4] animate-pulse">Listening...</span> : 'Tap ↑ to send'}
          </span>
          <span className="text-[10px] text-[#2d3f52]">
            {isStreaming
              ? <span className="text-[#4a5568]">{activeTool ? `Running ${activeTool}...` : 'Generating...'}</span>
              : isListening
                ? <span className="text-[#8892a4]">Voice active</span>
                : '5 tools · scanner · voice'
            }
          </span>
        </div>
      </div>

      {/* iOS home-indicator spacer */}
      <div className="flex-shrink-0 bg-[#0e1218]" style={{ height: 'env(safe-area-inset-bottom)' }} />
    </div>
  )
})

export default ChatInterface
