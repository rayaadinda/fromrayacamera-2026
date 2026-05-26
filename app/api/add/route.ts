export async function POST(request: Request) {
  const directusUrl = process.env.DIRECTUS_URL
  const directusToken = process.env.DIRECTUS_TOKEN

  if (!directusUrl || !directusToken) {
    return Response.json(
      { error: "Missing DIRECTUS_URL or DIRECTUS_TOKEN." },
      { status: 500 }
    )
  }

  const incoming = await request.formData()
  const itemPayload: Record<string, string | number> = {}

  ;["title", "description", "pos_x", "pos_y", "pos_z", "status"].forEach(
    (key) => {
      const value = incoming.get(key)
      if (typeof value === "string" && value.trim()) {
        if (key.startsWith("pos_")) {
          const numeric = Number.parseFloat(value)
          if (!Number.isNaN(numeric)) {
            itemPayload[key] = numeric
          }
        } else {
          itemPayload[key] = value.trim()
        }
      }
    }
  )

  const image = incoming.get("image")
  if (!(image instanceof File)) {
    return Response.json(
      { error: "Missing image file." },
      { status: 400 }
    )
  }

  if (!itemPayload.status) {
    itemPayload.status = "published"
  }

  const uploadForm = new FormData()
  uploadForm.set("file", image)

  const fileResponse = await fetch(`${directusUrl}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${directusToken}`,
    },
    body: uploadForm,
  })

  const filePayload = await fileResponse.json().catch(() => null)
  if (!fileResponse.ok) {
    return Response.json(filePayload || { error: "File upload failed." }, {
      status: fileResponse.status,
    })
  }

  const fileId = filePayload?.data?.id
  if (!fileId) {
    return Response.json(
      { error: "Upload succeeded but file ID missing." },
      { status: 500 }
    )
  }

  const itemResponse = await fetch(`${directusUrl}/items/images`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${directusToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...itemPayload,
      image: fileId,
    }),
  })

  const contentType = itemResponse.headers.get("content-type") || "application/json"
  const body = await itemResponse.text()

  return new Response(body, {
    status: itemResponse.status,
    headers: {
      "content-type": contentType,
    },
  })
}
