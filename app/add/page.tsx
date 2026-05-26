"use client"

import * as React from "react"
import { Check, Loader2, Trash2, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function AddPhotoPage() {
  const [uploads, setUploads] = React.useState<
    { id: string; file: File; previewUrl: string }[]
  >([])
  const [isDragging, setIsDragging] = React.useState(false)
  const [message, setMessage] = React.useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [uploadPhase, setUploadPhase] = React.useState<
    "idle" | "uploading" | "processing"
  >("idle")
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(
    null
  )
  const uploadsRef = React.useRef(uploads)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    uploadsRef.current = uploads
  }, [uploads])

  React.useEffect(() => {
    return () => {
      uploadsRef.current.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl)
      })
    }
  }, [])

  function formatBytes(bytes: number) {
    if (bytes === 0) {
      return "0 KB"
    }
    const kb = bytes / 1024
    if (kb < 1024) {
      return `${Math.round(kb)} KB`
    }
    const mb = kb / 1024
    return `${mb.toFixed(1)} MB`
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) {
      return
    }

    const imageFiles = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/")
    )

    if (imageFiles.length === 0) {
      setMessage({ type: "error", text: "Please select an image file." })
      return
    }

    const [file] = imageFiles
    const next = {
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }

    setUploads((prev) => {
      prev.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl)
      })
      return [next]
    })
    setMessage(null)
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    addFiles(event.target.files)
    event.currentTarget.value = ""
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    addFiles(event.dataTransfer.files)
  }

  function removeUpload(id: string) {
    setUploads((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((item) => item.id !== id)
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setMessage(null)
    setUploadProgress(null)
    setUploadPhase("uploading")

    if (uploads.length === 0) {
      setMessage({ type: "error", text: "Please add an image before saving." })
      return
    }

    const raw = new FormData(event.currentTarget)
    const formData = new FormData()

    ;["title", "description", "date", "location", "tags"].forEach((key) => {
      const value = raw.get(key)
      if (typeof value === "string" && value.trim()) {
        formData.set(key, value.trim())
      }
    })

    formData.set("status", "published")
    formData.set("image", uploads[0].file)

    setIsSubmitting(true)

    try {
      const responseText = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("POST", "/api/add")

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(percent)
          }
        })

        xhr.upload.addEventListener("load", () => {
          setUploadPhase("processing")
        })

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText)
          } else {
            reject(new Error(xhr.responseText || "Upload failed."))
          }
        })

        xhr.addEventListener("error", () => {
          reject(new Error("Network error. Please try again."))
        })

        xhr.send(formData)
      })

      const payload = responseText ? JSON.parse(responseText) : null
      if (payload?.errors?.length) {
        throw new Error(payload.errors[0]?.message || "Upload failed.")
      }

      setMessage({ type: "success", text: "Photo added to archive." })
      form.reset()
      setUploads([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Upload failed.",
      })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(null)
      setUploadPhase("idle")
    }
  }

  return (
    <main className="min-h-svh bg-white px-6 py-10 text-neutral-900">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            private route
          </p>
          <h1 className="text-lg font-semibold">Add photo</h1>
          <p className="text-xs text-neutral-500">
            Fill the metadata and upload the photo for the archive.
          </p>
        </div>

        <form
          className="space-y-6 rounded-xl border border-black/10 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="Photo title" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Short note about this photo"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="pos_x">Position X</Label>
                <Input id="pos_x" name="pos_x" type="number" step="0.1" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pos_y">Position Y</Label>
                <Input id="pos_y" name="pos_y" type="number" step="0.1" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pos_z">Position Z</Label>
                <Input id="pos_z" name="pos_z" type="number" step="0.1" />
              </div>
            </div>

          </div>

          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Upload files</p>
                  <p className="text-xs text-neutral-500">
                    Select and upload the files of your choice
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div
              className={`mt-5 rounded-xl border border-dashed bg-neutral-50/70 p-6 text-center transition ${
                isDragging
                  ? "border-neutral-400 bg-neutral-100"
                  : "border-neutral-200"
              }`}
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                id="fileUpload"
                type="file"
                className="sr-only"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleInputChange}
              />
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                <Upload className="h-4 w-4 text-neutral-500" />
              </div>
              <p className="mt-4 text-xs font-medium text-neutral-800">
                Choose a file or drag & drop it here.
              </p>
              <p className="mt-1 text-[0.65rem] text-neutral-500">
                JPEG, PNG, WEBP, and HEIC formats, up to 50 MB.
              </p>
              <div className="mt-4">
                <Button asChild variant="outline" size="sm">
                  <label htmlFor="fileUpload" className="cursor-pointer">
                    Browse File
                  </label>
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {uploads.length === 0 ? (
                <p className="text-center text-[0.65rem] text-neutral-400">
                  No images added yet.
                </p>
              ) : (
                uploads.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-neutral-200 bg-white p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 overflow-hidden rounded-lg bg-neutral-100">
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-medium">
                              {item.file.name}
                            </p>
                            <p className="text-[0.65rem] text-neutral-500">
                              {formatBytes(item.file.size)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-[0.65rem] text-emerald-500">
                            <Check className="h-3 w-3" />
                            Ready
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                          <div className="h-full w-full rounded-full bg-emerald-500" />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
                        aria-label={`Remove ${item.file.name}`}
                        onClick={() => removeUpload(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          <div className="space-y-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Uploading..." : "Add to archive"}
            </Button>
            {isSubmitting ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[0.7rem] text-neutral-500">
                  <span>
                    {uploadPhase === "processing"
                      ? "Finalizing"
                      : "Uploading"}
                  </span>
                  <span>
                    {uploadPhase === "processing" ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        ...
                      </span>
                    ) : (
                      `${uploadProgress ?? 0}%`
                    )}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-neutral-900 transition-all"
                    style={{
                      width: `${
                        uploadPhase === "processing" ? 100 : uploadProgress ?? 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ) : null}
            {message ? (
              <p
                className={`text-xs ${
                  message.type === "error" ? "text-rose-500" : "text-emerald-600"
                }`}
              >
                {message.text}
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </main>
  )
}
