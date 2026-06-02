import { NextResponse } from "next/server"

import { getImageItems, type ImageItem } from "@/lib/image-data"

type DirectusFile = {
  id: string
  width?: number
  height?: number
  title?: string
  location?: string
  metadata?: unknown
}

type DirectusImage = {
  id: string
  title?: string
  description?: string
  date_created?: string
  image?: DirectusFile | null
}

function buildDirectusAssetUrl(
  fileId: string,
  params?: Record<string, string | number>
) {
  if (!params) {
    return `/api/assets/${fileId}`
  }

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    search.set(key, String(value))
  }

  return `/api/assets/${fileId}?${search.toString()}`
}

async function fetchDirectusImages(baseUrl: string): Promise<ImageItem[]> {
  const url = new URL("/items/images", baseUrl)
  url.searchParams.set(
    "fields",
    "id,title,description,image.id,image.width,image.height,image.title,image.location,image.metadata"
  )
  url.searchParams.set("limit", "200")
  url.searchParams.set("filter[status][_eq]", "published")

  const response = await fetch(url.toString(), { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`Directus error: ${response.status}`)
  }

  const payload = (await response.json()) as { data?: DirectusImage[] }
  const items = payload.data ?? []

  function parseExifDate(value: string) {
    const trimmed = value.trim()
    const normalized = trimmed.replace(
      /^(\d{4}):(\d{2}):(\d{2})\s/,
      "$1-$2-$3T"
    )
    const parsed = new Date(normalized)
    if (Number.isNaN(parsed.getTime())) {
      return undefined
    }
    return parsed.toISOString()
  }

  function getMetadata(file: DirectusFile | null | undefined) {
    if (!file?.metadata) {
      return null
    }

    if (typeof file.metadata === "string") {
      try {
        return JSON.parse(file.metadata) as Record<string, unknown>
      } catch {
        return null
      }
    }

    if (typeof file.metadata === "object") {
      return file.metadata as Record<string, unknown>
    }

    return null
  }

  function getStringValue(value: unknown) {
    return typeof value === "string" && value.trim() ? value : undefined
  }

  function getCapturedDate(file: DirectusFile | null | undefined) {
    const metadata = getMetadata(file)
    const exif = metadata && typeof metadata.exif === "object" ? metadata.exif : null
    const ifd0 = metadata && typeof metadata.ifd0 === "object" ? metadata.ifd0 : null

    const raw =
      getStringValue(exif && (exif as Record<string, unknown>).DateTimeOriginal) ||
      getStringValue(exif && (exif as Record<string, unknown>).DateTimeDigitized) ||
      getStringValue(exif && (exif as Record<string, unknown>).CreateDate) ||
      getStringValue(exif && (exif as Record<string, unknown>).DateTime) ||
      getStringValue(ifd0 && (ifd0 as Record<string, unknown>).DateTime) ||
      getStringValue(metadata?.DateTimeOriginal) ||
      getStringValue(metadata?.CreateDate) ||
      getStringValue(metadata?.DateTime)

    if (!raw) {
      return undefined
    }

    return parseExifDate(raw) || raw
  }

  return items
    .map((item) => {
      const file = item.image
      if (!file?.id) {
        return null
      }

      const capturedDate = getCapturedDate(file)

      return {
        id: item.id,
        url: buildDirectusAssetUrl(file.id),
        previewUrl: buildDirectusAssetUrl(file.id, {
          width: 640,
          quality: 80,
        }),
        thumbUrl: buildDirectusAssetUrl(file.id, { width: 900, quality: 85 }),
        modalUrl: buildDirectusAssetUrl(file.id, { width: 1600, quality: 85 }),
        width: file.width ?? 1200,
        height: file.height ?? 800,
        title: item.title ?? file.title,
        description: item.description,
        location: file.location,
        date: capturedDate,
      }
    })
    .filter(Boolean) as ImageItem[]
}

export async function GET() {
  const directusUrl =
    process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL

  if (!directusUrl) {
    return NextResponse.json({ items: getImageItems() })
  }

  try {
    const items = await fetchDirectusImages(directusUrl)
    return NextResponse.json({ items })
  } catch (error) {
    console.error("Failed to fetch Directus images", error)
  }

  return NextResponse.json({ items: [] })
}
