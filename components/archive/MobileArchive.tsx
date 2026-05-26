"use client"

import Image from "next/image"

import type { ImageItem } from "@/lib/image-data"

type MobileArchiveProps = {
  images: ImageItem[]
  onSelect: (image: ImageItem) => void
}

function getMobileImageUrl(image: ImageItem) {
  return image.thumbUrl ?? image.previewUrl ?? image.url
}

function getMobileImageWidth(image: ImageItem) {
  return Math.min(image.width, 900)
}

export function MobileArchive({ images, onSelect }: MobileArchiveProps) {
  return (
    <div className="h-full w-full overflow-y-auto px-4 py-24">
      <div className="columns-2 gap-3">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            className="mb-3 block w-full break-inside-avoid overflow-hidden rounded-[3px] bg-neutral-100 text-left shadow-sm"
            onClick={() => onSelect(image)}
          >
            <Image
              src={getMobileImageUrl(image)}
              alt={image.title || ""}
              width={getMobileImageWidth(image)}
              height={Math.round(
                (getMobileImageWidth(image) / image.width) * image.height
              )}
              sizes="(max-width: 768px) 48vw, 450px"
              loading={index < 6 ? "eager" : "lazy"}
              unoptimized
              className="h-auto w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
