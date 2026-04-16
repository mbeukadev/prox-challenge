'use client'

import { useEffect } from 'react'
import { X, Camera, Zap } from 'lucide-react'

interface MachineScannerModalProps {
  onClose: () => void
  onLaunch: () => void
}

export default function MachineScannerModal({ onClose, onLaunch }: MachineScannerModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleLaunch() {
    onLaunch()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0a0d10]/85 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl border border-[#1e2b3a] overflow-hidden bg-[#0e1218] shadow-2xl">

        {/* ── Hero image with viewfinder overlay ────────────────────────── */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/product.webp"
            alt="Vulcan OmniPro 220"
            className="w-full h-full object-cover opacity-50"
          />

          {/* Dark gradient at bottom so text reads clearly */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1218] via-transparent to-transparent" />

          {/* Viewfinder — corner L-marks + center reticle */}
          <svg
            viewBox="0 0 320 240"
            className="absolute inset-0 w-full h-full"
            aria-hidden="true"
          >
            {/* Corner marks */}
            <g stroke="#f0f4f8" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.9">
              {/* Top-left */}
              <path d="M 48 80 L 48 52 L 76 52" />
              {/* Top-right */}
              <path d="M 244 52 L 272 52 L 272 80" />
              {/* Bottom-left */}
              <path d="M 48 160 L 48 188 L 76 188" />
              {/* Bottom-right */}
              <path d="M 244 188 L 272 188 L 272 160" />
            </g>

            {/* Center reticle */}
            <g stroke="#f0f4f8" strokeWidth="1.5" opacity="0.5">
              <line x1="160" y1="112" x2="160" y2="122" />
              <line x1="160" y1="128" x2="160" y2="138" />
              <line x1="142" y1="125" x2="152" y2="125" />
              <line x1="168" y1="125" x2="178" y2="125" />
              <circle cx="160" cy="125" r="6" fill="none" />
            </g>

            {/* Scan line animation */}
            <line
              x1="48" y1="120" x2="272" y2="120"
              stroke="#f0f4f8"
              strokeWidth="0.75"
              opacity="0.2"
              strokeDasharray="4 6"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 -50"
                to="0 50"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </line>
          </svg>

          {/* BETA badge — top-left */}
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1a2332]/90 border border-[#243040] text-[9px] font-semibold text-[#8892a4] tracking-widest uppercase">
            <Zap size={8} />
            Preview
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-[#1a2332]/90 border border-[#243040] text-[#8892a4] hover:text-[#f0f4f8] transition-colors"
            aria-label="Close"
          >
            <X size={13} />
          </button>
        </div>

        {/* ── Content ──────────────────────────────────────────────────── */}
        <div className="px-5 pb-5 pt-4">
          <h2 className="text-[15px] font-semibold text-[#f0f4f8] tracking-[-0.01em]">
            Machine Scanner
          </h2>
          <p className="mt-1.5 text-[12px] text-[#8892a4] leading-relaxed">
            Point your camera at any component for real-time identification and guidance.
            Upload a photo of your weld bead, machine panel, or wire feed for instant AI analysis.
          </p>

          {/* Feature list */}
          <ul className="mt-3 space-y-1.5">
            {[
              'Weld defect identification',
              'Component label recognition',
              'Settings troubleshooting from panel photo',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-[11px] text-[#4a5568]">
                <span className="w-1 h-1 rounded-full bg-[#2d3f52] flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={handleLaunch}
            className="mt-5 w-full flex items-center justify-center gap-2
              py-2.5 rounded-lg bg-[#f0f4f8] text-[#0e1218]
              text-[13px] font-semibold
              hover:bg-white active:bg-[#e2e8f0]
              transition-colors duration-100 touch-manipulation"
          >
            <Camera size={14} />
            Launch Scanner
          </button>
        </div>
      </div>
    </div>
  )
}
