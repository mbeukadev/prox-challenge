'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ZoomIn, BookOpen } from 'lucide-react'

interface ImageViewerProps {
  path: string
  description: string
  manualPage?: number
}

export default function ImageViewer({ path, description, manualPage }: ImageViewerProps) {
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, close])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* ── Thumbnail ───────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className="
          group relative w-full overflow-hidden rounded-lg
          border border-[#1e2b3a] bg-[#0e1218]
          hover:border-[#243040] transition-colors duration-150
          text-left
        "
      >
        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={path}
          alt={description}
          className="w-full object-contain max-h-64 opacity-90 group-hover:opacity-100 transition-opacity"
          loading="lazy"
        />

        {/* Hover overlay */}
        <div className="
          absolute inset-0 flex items-center justify-center
          opacity-0 group-hover:opacity-100 transition-opacity
          bg-[#0e1218]/50
        ">
          <div className="flex items-center gap-1.5 bg-[#141c24] border border-[#243040] rounded-lg px-3 py-1.5 text-[11px] text-[#f0f4f8]">
            <ZoomIn size={11} />
            <span>Expand</span>
          </div>
        </div>

        {/* Footer bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#1e2b3a] bg-[#0e1218]">
          <p className="text-[11px] text-[#8892a4] truncate pr-2">{description}</p>
          {manualPage && (
            <span className="flex items-center gap-1 text-[10px] text-[#4a5568] shrink-0">
              <BookOpen size={9} />
              p.{manualPage}
            </span>
          )}
        </div>
      </button>

      {/* ── Fullscreen modal ─────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          onClick={close}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#0e1218]/92 backdrop-blur-sm" />

          {/* Modal content */}
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col rounded-xl border border-[#243040] bg-[#141c24] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2b3a]">
              <div className="flex items-center gap-2">
                {manualPage && (
                  <span className="text-[10px] text-[#5eead4] bg-[#1a3a38] border border-[#243040] rounded px-1.5 py-0.5 font-medium">
                    p.{manualPage}
                  </span>
                )}
                <p className="text-[12px] text-[#c4cdd8]">{description}</p>
              </div>
              <button
                onClick={close}
                className="w-6 h-6 flex items-center justify-center rounded text-[#4a5568] hover:text-[#f0f4f8] hover:bg-[#1e2b3a] transition-colors"
              >
                <X size={13} />
              </button>
            </div>

            {/* Modal image */}
            <div className="overflow-auto flex-1 flex items-start justify-center p-4 bg-[#0e1218]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={path}
                alt={description}
                className="max-w-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
