import { NextResponse } from "next/server"

import { getImageItems, type ImageItem } from "@/lib/image-data"

type DirectusFile = {
  id: string
  width?: number
  height?: number
  title?: string
}

type DirectusImage = {
  id: string
  title?: string
  description?: string
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
    "id,title,description,image.id,image.width,image.height,image.title"
  )
  url.searchParams.set("limit", "200")
  url.searchParams.set("filter[status][_eq]", "published")

  const response = await fetch(url.toString(), { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`Directus error: ${response.status}`)
  }

  const payload = (await response.json()) as { data?: DirectusImage[] }
  const items = payload.data ?? []

  return items
    .map((item) => {
      const file = item.image
      if (!file?.id) {
        return null
      }

      return {
        id: item.id,
        url: buildDirectusAssetUrl(file.id),
        previewUrl: buildDirectusAssetUrl(file.id, {
          width: 360,
          quality: 60,
        }),
        thumbUrl: buildDirectusAssetUrl(file.id, { width: 640, quality: 70 }),
        modalUrl: buildDirectusAssetUrl(file.id, { width: 1600, quality: 80 }),
        width: file.width ?? 1200,
        height: file.height ?? 800,
        title: item.title ?? file.title,
        description: item.description,
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
