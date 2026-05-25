import { NextResponse } from "next/server"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: Request, context: RouteContext) {
  const directusUrl =
    process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL

  if (!directusUrl) {
    return NextResponse.json(
      { error: "Directus URL not configured" },
      { status: 500 }
    )
  }

  const { id } = await context.params
  const requestUrl = new URL(request.url)
  const assetUrl = new URL(`/assets/${id}`, directusUrl)
  assetUrl.search = requestUrl.search

  let upstream = await fetch(assetUrl.toString(), { cache: "no-store" })

  if (!upstream.ok && assetUrl.search) {
    const fallbackUrl = new URL(`/assets/${id}`, directusUrl)
    upstream = await fetch(fallbackUrl.toString(), { cache: "no-store" })
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Directus asset error: ${upstream.status}` },
      { status: upstream.status }
    )
  }

  const contentType =
    upstream.headers.get("content-type") || "application/octet-stream"
  const cacheControl =
    upstream.headers.get("cache-control") || "public, max-age=86400"
  const body = upstream.body

  if (!body) {
    return NextResponse.json(
      { error: "Directus asset response missing body" },
      { status: 502 }
    )
  }

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    },
  })
}
