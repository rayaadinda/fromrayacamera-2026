"use client"

import * as React from "react"

import { ArchiveCanvas } from "@/components/archive/ArchiveCanvas"
import { ImageModal } from "@/components/archive/ImageModal"
import type { ImageItem } from "@/lib/image-data"

export default function Page() {
  const [images, setImages] = React.useState<ImageItem[]>([])
  const [selected, setSelected] = React.useState<ImageItem | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [sceneReady, setSceneReady] = React.useState(false)
  const [loadProgress, setLoadProgress] = React.useState({ loaded: 0, total: 0 })
  const [showIntroText, setShowIntroText] = React.useState(true)

  const handleProgress = React.useCallback((loaded: number, total: number) => {
    setLoadProgress({ loaded, total })
  }, [])

  React.useEffect(() => {
    let isActive = true

    async function loadImages() {
      try {
        const response = await fetch("/api/images")
        const data = (await response.json()) as { items?: ImageItem[] }

        if (isActive) {
          const items = data.items ?? []
          setImages(items)
          setSceneReady(false)
          setLoadProgress({ loaded: 0, total: items.length })
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
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          !isLoading && (images.length === 0 || sceneReady)
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <ArchiveCanvas
          images={images}
          onSelect={setSelected}
          onReady={() => setSceneReady(true)}
          onProgress={handleProgress}
        />
      </div>

      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
          showIntroText && !isLoading && (images.length === 0 || sceneReady)
            ? "opacity-100"
            : "opacity-0"
        }`}
      >
        <p className="text-center text-xs font-medium tracking-[0.28em] text-[#7a1f1f] md:text-sm">
          an archive of everything i&apos;ve seen
        </p>
      </div>

      {(isLoading || (images.length > 0 && !sceneReady)) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/75">
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
            Loading archive
            {loadProgress.total > 0
              ? ` ${Math.round(
                  (loadProgress.loaded / loadProgress.total) * 100
                )}%`
              : ""}
          </div>
        </div>
      )}

      {/* <MusicPlayer /> */}

      <ImageModal image={selected} onClose={() => setSelected(null)} />
    </main>
  )
}
