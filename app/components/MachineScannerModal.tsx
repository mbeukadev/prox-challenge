'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Camera, Zap, AlertCircle } from 'lucide-react'

type Phase = 'permission' | 'scanning' | 'denied'

interface MachineScannerModalProps {
  onClose: () => void
  onCapture: (base64: string, mimeType: string) => void
}

export default function MachineScannerModal({ onClose, onCapture }: MachineScannerModalProps) {
  const [phase, setPhase] = useState<Phase>('permission')
  const [flash, setFlash] = useState(false)

  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Stop camera on unmount
  useEffect(() => () => stopCamera(), [])

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  function handleClose() {
    stopCamera()
    onClose()
  }

  async function requestCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      setPhase('scanning')
      // Wire stream to video element after state update
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })
    } catch {
      setPhase('denied')
    }
  }

  function capture() {
    const video = videoRef.current
    if (!video || video.readyState < 2) return

    // Flash effect
    setFlash(true)
    setTimeout(() => setFlash(false), 150)

    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth  || 1280
    canvas.height = video.videoHeight || 960
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    const base64  = dataUrl.split(',')[1]

    stopCamera()
    onCapture(base64, 'image/jpeg')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0a0d10]/90 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative w-full sm:max-w-sm sm:mx-5 rounded-t-2xl sm:rounded-2xl border border-[#1e2b3a] overflow-hidden bg-[#0e1218] shadow-2xl flex flex-col"
           style={{ maxHeight: '92dvh' }}>

        {/* ── Permission phase ─────────────────────────────────────────── */}
        {phase === 'permission' && (
          <>
            {/* Decorative viewfinder header */}
            <div className="relative bg-[#080b0f] flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
              {/* Manual diagram zoomed in — no readable text, abstract scan feel */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/manual-pages/page-08-front-panel-controls.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-30"
                style={{ transform: 'scale(2.8)', transformOrigin: '55% 40%', filter: 'grayscale(30%) contrast(1.1)' }}
              />

              {/* Viewfinder SVG */}
              <svg viewBox="0 0 320 240" className="absolute inset-0 w-full h-full" aria-hidden="true">
                <g stroke="#f0f4f8" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6">
                  <path d="M 60 90 L 60 60 L 90 60" />
                  <path d="M 230 60 L 260 60 L 260 90" />
                  <path d="M 60 150 L 60 180 L 90 180" />
                  <path d="M 230 180 L 260 180 L 260 150" />
                </g>
                <circle cx="160" cy="120" r="8" stroke="#f0f4f8" strokeWidth="1.5" fill="none" opacity="0.4" />
                <line x1="160" y1="108" x2="160" y2="113" stroke="#f0f4f8" strokeWidth="1.5" opacity="0.4" />
                <line x1="160" y1="127" x2="160" y2="132" stroke="#f0f4f8" strokeWidth="1.5" opacity="0.4" />
                <line x1="148" y1="120" x2="153" y2="120" stroke="#f0f4f8" strokeWidth="1.5" opacity="0.4" />
                <line x1="167" y1="120" x2="172" y2="120" stroke="#f0f4f8" strokeWidth="1.5" opacity="0.4" />
              </svg>

              {/* Camera icon centered */}
              <div className="relative flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#f0f4f8]/10 border border-[#f0f4f8]/20 flex items-center justify-center">
                  <Camera size={26} className="text-[#f0f4f8]/80" />
                </div>
              </div>

              {/* Preview badge */}
              <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1a2332]/90 border border-[#243040] text-[9px] font-semibold text-[#8892a4] tracking-widest uppercase">
                <Zap size={8} />
                Preview
              </div>

              <button onClick={handleClose} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-[#1a2332]/90 border border-[#243040] text-[#8892a4] hover:text-[#f0f4f8] transition-colors" aria-label="Close">
                <X size={13} />
              </button>
            </div>

            <div className="px-5 pb-6 pt-4">
              <h2 className="text-[15px] font-semibold text-[#f0f4f8] tracking-[-0.01em]">Machine Scanner</h2>
              <p className="mt-1.5 text-[12px] text-[#8892a4] leading-relaxed">
                Point your camera at any component for real-time identification — panels, wire feed, weld beads, and more.
              </p>

              <div className="mt-3 px-3 py-2.5 rounded-lg bg-[#141c24] border border-[#1e2b3a] flex items-start gap-2.5">
                <Camera size={13} className="text-[#4a5568] mt-px flex-shrink-0" />
                <p className="text-[11px] text-[#4a5568] leading-snug">
                  Prox will ask to access your camera. Your feed is never recorded or stored.
                </p>
              </div>

              <button
                onClick={requestCamera}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#f0f4f8] text-[#0e1218] text-[13px] font-semibold hover:bg-white active:bg-[#e2e8f0] transition-colors duration-100 touch-manipulation"
              >
                <Camera size={14} />
                Allow Camera Access
              </button>
            </div>
          </>
        )}

        {/* ── Live scanning phase ──────────────────────────────────────── */}
        {phase === 'scanning' && (
          <div className="relative flex-1 bg-black" style={{ minHeight: '60dvh' }}>
            {/* Live video feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ minHeight: '60dvh' }}
            />

            {/* Flash overlay */}
            {flash && <div className="absolute inset-0 bg-white z-20 pointer-events-none" />}

            {/* Viewfinder overlay */}
            <svg viewBox="0 0 320 480" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
              {/* Dark vignette edges */}
              <defs>
                <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
                  <stop offset="60%" stopColor="transparent" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0.5" />
                </radialGradient>
              </defs>
              <rect width="320" height="480" fill="url(#vignette)" />

              {/* Corner marks */}
              <g stroke="#f0f4f8" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9">
                <path d="M 50 110 L 50 80 L 80 80" />
                <path d="M 240 80 L 270 80 L 270 110" />
                <path d="M 50 370 L 50 400 L 80 400" />
                <path d="M 240 400 L 270 400 L 270 370" />
              </g>

              {/* Center reticle */}
              <g stroke="#f0f4f8" strokeWidth="1.5" opacity="0.6">
                <line x1="160" y1="228" x2="160" y2="238" />
                <line x1="160" y1="248" x2="160" y2="258" />
                <line x1="142" y1="243" x2="152" y2="243" />
                <line x1="168" y1="243" x2="178" y2="243" />
                <circle cx="160" cy="243" r="7" fill="none" />
              </g>

              {/* Animated scan line */}
              <line x1="50" y1="240" x2="270" y2="240" stroke="#f0f4f8" strokeWidth="0.75" opacity="0.25" strokeDasharray="5 8">
                <animateTransform attributeName="transform" type="translate" from="0 -160" to="0 160" dur="2.5s" repeatCount="indefinite" />
              </line>
            </svg>

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 pb-2 bg-gradient-to-b from-black/60 to-transparent">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 text-[10px] font-semibold text-white/70 tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
                Live
              </div>
              <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 border border-white/10 text-white/70 hover:text-white transition-colors" aria-label="Close">
                <X size={14} />
              </button>
            </div>

            {/* Bottom capture bar */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center px-6 pb-8 pt-4 bg-gradient-to-t from-black/70 to-transparent">
              <button
                onClick={capture}
                className="w-16 h-16 rounded-full border-4 border-white bg-white/10 hover:bg-white/25 active:bg-white/40 transition-colors duration-100 touch-manipulation flex items-center justify-center"
                aria-label="Capture"
              >
                <div className="w-10 h-10 rounded-full bg-white" />
              </button>
            </div>
          </div>
        )}

        {/* ── Denied phase ─────────────────────────────────────────────── */}
        {phase === 'denied' && (
          <div className="flex flex-col items-center text-center px-6 py-10 gap-4">
            <div className="w-12 h-12 rounded-full bg-[#1a2332] border border-[#243040] flex items-center justify-center">
              <AlertCircle size={20} className="text-[#4a5568]" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#f0f4f8]">Camera access denied</p>
              <p className="mt-1 text-[12px] text-[#4a5568] leading-relaxed">
                Enable camera permission in your browser or system settings, then try again.
              </p>
            </div>
            <button
              onClick={requestCamera}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#1a2332] border border-[#243040] text-[#c4cdd8] text-[13px] font-medium hover:border-[#2d3f52] transition-colors"
            >
              Try again
            </button>
            <button onClick={handleClose} className="text-[11px] text-[#4a5568] hover:text-[#8892a4]">Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}
