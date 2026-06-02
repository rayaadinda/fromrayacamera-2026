"use client"

import * as React from "react"
import { Inter } from "next/font/google"

import { ArchiveCanvas } from "@/components/archive/ArchiveCanvas"
import { ImageModal } from "@/components/archive/ImageModal"
import type { ImageItem } from "@/lib/image-data"

const instagramHref = "https://instagram.com/fromrayacamera"
const inter = Inter({ subsets: ["latin"] })

export default function Page() {
  const [images, setImages] = React.useState<ImageItem[]>([])
  const [selected, setSelected] = React.useState<ImageItem | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [sceneReady, setSceneReady] = React.useState(false)
  const [loadProgress, setLoadProgress] = React.useState(0)
  const [showIntroText, setShowIntroText] = React.useState(true)

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
          setLoadProgress(0)
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
    if (isLoading || images.length === 0 || sceneReady) {
      return
    }

    let progress = 0

    const interval = window.setInterval(() => {
      progress = Math.min(progress + Math.ceil(Math.random() * 7), 100)
      setLoadProgress(progress)

      if (progress >= 100) {
        window.clearInterval(interval)
        window.setTimeout(() => {
          setSceneReady(true)
        }, 250)
      }
    }, 120)

    return () => window.clearInterval(interval)
  }, [images.length, isLoading, sceneReady])

  const canMountArchive = !isLoading
  const isArchiveVisible = canMountArchive
  const canShowIntroText = !isLoading && (images.length === 0 || sceneReady)

  React.useEffect(() => {
    if (!canShowIntroText) {
      return
    }

    const timeout = window.setTimeout(() => {
      setShowIntroText(false)
    }, 8200)

    return () => window.clearTimeout(timeout)
  }, [canShowIntroText])

  return (
    <main className="relative h-svh w-full overflow-hidden bg-white text-neutral-900">
      <a
        href={instagramHref}
        target="_blank"
        rel="noreferrer"
        className={`absolute bottom-4 right-4 z-30 pointer-events-auto text-[10px] font-medium tracking-wider antialiased text-black transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 sm:bottom-6 sm:right-6 sm:text-[11px] ${inter.className}`}
        aria-label="Visit @fromrayacamera on Instagram"
      >
        @fromrayacamera
      </a>

      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isArchiveVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {canMountArchive && (
          <ArchiveCanvas images={images} onSelect={setSelected} />
        )}
      </div>

      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
          showIntroText && canShowIntroText ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="text-center text-sm font-medium tracking-wide text-black md:text-xl">
          an archive of everything i&apos;ve seen
        </p>
      </div>

      {(isLoading || (images.length > 0 && !sceneReady)) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/45">
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
            Loading archive {loadProgress}%
          </div>
        </div>
      )}

      {/* <MusicPlayer /> */}

      <ImageModal image={selected} onClose={() => setSelected(null)} />
    </main>
  )
}
