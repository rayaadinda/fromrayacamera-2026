"use client"

import * as React from "react"

import type { ImageItem } from "@/lib/image-data"
import Image from "next/image"
import { Inter } from "next/font/google"

import { Skeleton } from "@/components/ui/skeleton"

const inter = Inter({ subsets: ["latin"] })

type ImageModalProps = {
  image: ImageItem | null
  onClose: () => void
}

function getModalSize(image: ImageItem) {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 }
  }

  const maxWidth = window.innerWidth * 0.8
  const maxHeight = window.innerHeight * 0.7
  const aspect = image.width / image.height
  let width = maxWidth
  let height = width / aspect

  if (height > maxHeight) {
    height = maxHeight
    width = height * aspect
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  }
}

type ModalContentProps = {
  image: ImageItem
  onClose: () => void
}

function ModalContent({ image, onClose }: ModalContentProps) {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [modalSize, setModalSize] = React.useState(() => getModalSize(image))

  const formattedDate = React.useMemo(() => {
    if (!image.date) {
      return ""
    }
    const parsed = new Date(image.date)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    }
    return image.date
  }, [image.date])

  const metaText = React.useMemo(() => {
    const location = image.location?.trim()
    return [location, formattedDate].filter(Boolean).join(" ")
  }, [formattedDate, image.location])

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [image, onClose])

  React.useEffect(() => {
    let rafId = 0

    function updateSize() {
      setModalSize(getModalSize(image))
    }

    rafId = window.requestAnimationFrame(updateSize)
    window.addEventListener("resize", updateSize)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener("resize", updateSize)
    }
  }, [image])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-6xl flex-col gap-6 p-4 md:flex-row"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-1 items-center justify-center">
          <div
            className="relative"
            style={{
              width: modalSize.width || undefined,
              height: modalSize.height || undefined,
              minHeight: modalSize.height ? undefined : "60vh",
              minWidth: modalSize.width ? undefined : "70vw",
            }}
          >
            {!isLoaded && (
              <Skeleton className="absolute inset-0 bg-white/40" />
            )}
            <Image
              src={image.modalUrl ?? image.url}
              alt={image.title || ""}
              width={image.width}
              height={image.height}
              unoptimized
              className={`h-full w-full rounded-md object-contain shadow-2xl transition-opacity duration-300 ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setIsLoaded(true)}
              onError={() => setIsLoaded(true)}
              priority
            />
          </div>
        </div>
        <div
          className={`flex w-full max-w-sm flex-col text-sm leading-relaxed text-white/80 ${
            inter.className
          }`}
        >
          <p className="text-xl font-medium tracking-wide antialiased text-white">
            {image.title || "Untitled"}
          </p>
          <p className="text-sm antialiased mt-3 tracking-normal text-white/70">
            {image.description || "A short note lives next to this frame."}
          </p>
          {metaText ? (
            <p className="mt-auto pt-4 text-xs tracking-wide text-white/50">
              {metaText}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function ImageModal({ image, onClose }: ImageModalProps) {
  if (!image) {
    return null
  }

  return <ModalContent key={image.id} image={image} onClose={onClose} />
}
