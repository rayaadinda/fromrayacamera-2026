"use client"

import * as React from "react"

import { ArchiveCanvas } from "@/components/archive/ArchiveCanvas"
import { ImageModal } from "@/components/archive/ImageModal"
import type { ImageItem } from "@/lib/image-data"

export default function Page() {
  const [images, setImages] = React.useState<ImageItem[]>([])
  const [selected, setSelected] = React.useState<ImageItem | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [showIntroText, setShowIntroText] = React.useState(true)

  React.useEffect(() => {
    let isActive = true

    async function loadImages() {
      try {
        const response = await fetch("/api/images")
        const data = (await response.json()) as { items?: ImageItem[] }

        if (isActive) {
          setImages(data.items ?? [])
        }
      } catch (error) {
        console.error("Failed to load images", error)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadImages()

    return () => {
      isActive = false
    }
  }, [])

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setShowIntroText(false)
    }, 2200)

    return () => window.clearTimeout(timeout)
  }, [])

  return (
    <main className="relative h-svh w-full overflow-hidden bg-white text-neutral-900">
      <div className="absolute inset-0">
        <ArchiveCanvas images={images} onSelect={setSelected} />
      </div>

      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
          showIntroText ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="text-center text-xs font-medium tracking-[0.28em] text-[#7a1f1f] md:text-sm">
          an archive of everything i&apos;ve seen
        </p>
      </div>

      {isLoading && (
        <div className="pointer-events-none absolute left-6 top-6 text-xs text-neutral-500">
          Loading archive...
        </div>
      )}

      <ImageModal image={selected} onClose={() => setSelected(null)} />
    </main>
  )
}
