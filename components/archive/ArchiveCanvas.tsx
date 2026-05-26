"use client"

import * as React from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { MathUtils, Vector2, type Group } from "three"

import type { ImageItem } from "@/lib/image-data"
import { ImageNode, type DragState } from "./ImageNode"

type ArchiveCanvasProps = {
  images: ImageItem[]
  onSelect: (image: ImageItem) => void
}

type LayoutItem = {
  image: ImageItem
  position: [number, number, number]
  tilt: number
}

const WORLD_EXTENT = { x: 12, y: 8 }
const WORLD_DEPTH = 5
const PAN_BOUNDS = { x: 10, y: 6 }
const DRAG_SPEED = 0.02
const INERTIA_FRICTION = 0.86
const ZOOM_MIN = 0
const ZOOM_MAX = 10
const ZOOM_SPEED = 0.008

function usePrefersReducedCanvas() {
  const [prefersReducedCanvas, setPrefersReducedCanvas] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(max-width: 768px), (pointer: coarse)"
    )

    function updatePreference() {
      setPrefersReducedCanvas(mediaQuery.matches)
    }

    updatePreference()
    mediaQuery.addEventListener("change", updatePreference)

    return () => {
      mediaQuery.removeEventListener("change", updatePreference)
    }
  }, [])

  return prefersReducedCanvas
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function hashString(value: string) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function getImageRadius(image: ImageItem) {
  const base = 1.35
  const aspect = image.width / image.height
  const width = aspect >= 1 ? base * aspect : base
  const height = aspect >= 1 ? base : base / aspect
  return Math.hypot(width / 2, height / 2)
}

function buildLayout(images: ImageItem[]): LayoutItem[] {
  const placed: Array<{ x: number; y: number; r: number }> = []
  const minCenter = 2.5
  const overlapFactor = 0.72
  const maxAttempts = 60

  return images.map((image, index) => {
    const rand = mulberry32(hashString(`${image.id}-${index}`))
    const radius = getImageRadius(image)
    let x = 0
    let y = 0

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      x = (rand() - 0.5) * WORLD_EXTENT.x * 2
      y = (rand() - 0.5) * WORLD_EXTENT.y * 2

      const distanceFromCenter = Math.hypot(x, y)
      if (distanceFromCenter < minCenter) {
        const angle = rand() * Math.PI * 2
        x = Math.cos(angle) * minCenter
        y = Math.sin(angle) * minCenter
      }

      let isClear = true
      for (const existing of placed) {
        const minDistance = (radius + existing.r) * overlapFactor
        if (Math.hypot(x - existing.x, y - existing.y) < minDistance) {
          isClear = false
          break
        }
      }

      if (isClear) {
        break
      }
    }

    placed.push({ x, y, r: radius })

    const z = (rand() - 0.5) * WORLD_DEPTH

    return {
      image,
      position: [x, y, z],
      tilt: 0,
    }
  })
}

export function ArchiveCanvas({
  images,
  onSelect,
}: ArchiveCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const invalidateRef = React.useRef<null | (() => void)>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const panTargetRef = React.useRef(new Vector2(0, 0))
  const panCurrentRef = React.useRef(new Vector2(0, 0))
  const panVelocityRef = React.useRef(new Vector2(0, 0))
  const velocitySampleRef = React.useRef(new Vector2(0, 0))
  const zoomTargetRef = React.useRef(12)
  const zoomCurrentRef = React.useRef(12)
  const dragStateRef = React.useRef<DragState>({ active: false, dragged: false })
  const lastPointerRef = React.useRef({ x: 0, y: 0 })
  const isPinchingRef = React.useRef(false)
  const pinchStartDistanceRef = React.useRef(0)
  const pinchStartZoomRef = React.useRef(12)
  const prefersReducedCanvas = usePrefersReducedCanvas()

  const layout = React.useMemo(() => buildLayout(images), [images])

  React.useEffect(() => {
    if (images.length > 0) {
      invalidateRef.current?.()
    }
  }, [images, layout])

  const stopDragging = React.useCallback(() => {
    dragStateRef.current.active = false
    setIsDragging(false)
    invalidateRef.current?.()

    window.setTimeout(() => {
      dragStateRef.current.dragged = false
    }, 0)
  }, [])

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      dragStateRef.current.active = true
      dragStateRef.current.dragged = false
      lastPointerRef.current = { x: event.clientX, y: event.clientY }
      setIsDragging(true)
      invalidateRef.current?.()
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    []
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStateRef.current.active || isPinchingRef.current) {
        return
      }

      const dx = event.clientX - lastPointerRef.current.x
      const dy = event.clientY - lastPointerRef.current.y

      if (Math.abs(dx) + Math.abs(dy) > 2) {
        dragStateRef.current.dragged = true
      }

      lastPointerRef.current = { x: event.clientX, y: event.clientY }

      const vx = dx * DRAG_SPEED
      const vy = -dy * DRAG_SPEED
      velocitySampleRef.current.set(vx, vy)
      panVelocityRef.current.lerp(velocitySampleRef.current, 0.35)

      panTargetRef.current.x += vx
      panTargetRef.current.y += vy

      panTargetRef.current.x = clamp(
        panTargetRef.current.x,
        -PAN_BOUNDS.x,
        PAN_BOUNDS.x
      )
      panTargetRef.current.y = clamp(
        panTargetRef.current.y,
        -PAN_BOUNDS.y,
        PAN_BOUNDS.y
      )
      invalidateRef.current?.()
    },
    []
  )

  const handlePointerUp = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      stopDragging()
      event.currentTarget.releasePointerCapture(event.pointerId)
      invalidateRef.current?.()
    },
    [stopDragging]
  )

  const handlePointerLeave = React.useCallback(() => {
    stopDragging()
    invalidateRef.current?.()
  }, [stopDragging])

  const handleWheel = React.useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const next = zoomTargetRef.current + event.deltaY * ZOOM_SPEED
    zoomTargetRef.current = clamp(next, ZOOM_MIN, ZOOM_MAX)
    invalidateRef.current?.()
  }, [])

  const handleTouchStart = React.useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (event.touches.length === 2) {
        const first = event.touches.item(0)
        const second = event.touches.item(1)
        if (!first || !second) {
          return
        }
        const dx = first.clientX - second.clientX
        const dy = first.clientY - second.clientY
        pinchStartDistanceRef.current = Math.hypot(dx, dy)
        pinchStartZoomRef.current = zoomTargetRef.current
        isPinchingRef.current = true
        dragStateRef.current.active = false
        invalidateRef.current?.()
      }
    },
    []
  )

  const handleTouchMove = React.useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!isPinchingRef.current || event.touches.length !== 2) {
        return
      }

      const first = event.touches.item(0)
      const second = event.touches.item(1)
      if (!first || !second) {
        return
      }
      const dx = first.clientX - second.clientX
      const dy = first.clientY - second.clientY
      const distance = Math.hypot(dx, dy)
      const scale = distance / Math.max(pinchStartDistanceRef.current, 1)
      const nextZoom = pinchStartZoomRef.current / scale
      zoomTargetRef.current = clamp(nextZoom, ZOOM_MIN, ZOOM_MAX)
      invalidateRef.current?.()
    },
    []
  )

  const handleTouchEnd = React.useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length < 2) {
      isPinchingRef.current = false
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`h-full w-full ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ touchAction: "none" }}
    >
      <Canvas
        dpr={prefersReducedCanvas ? 1 : [1, 1.5]}
        camera={{ position: [0, 0, 12], fov: 45, near: 0.1, far: 100 }}
        gl={{
          antialias: !prefersReducedCanvas,
          alpha: true,
          powerPreference: prefersReducedCanvas
            ? "default"
            : "high-performance",
        }}
        eventSource={containerRef as React.RefObject<HTMLElement>}
        eventPrefix="client"
        frameloop="demand"
        onCreated={({ invalidate }) => {
          invalidateRef.current = invalidate
          invalidate()
        }}
      >
        <ArchiveScene
          layout={layout}
          dragStateRef={dragStateRef}
          onSelect={onSelect}
          panCurrentRef={panCurrentRef}
          panTargetRef={panTargetRef}
          panVelocityRef={panVelocityRef}
          zoomCurrentRef={zoomCurrentRef}
          zoomTargetRef={zoomTargetRef}
          preferPreview={prefersReducedCanvas}
        />
      </Canvas>
    </div>
  )
}

type ArchiveSceneProps = {
  layout: LayoutItem[]
  onSelect: (image: ImageItem) => void
  dragStateRef: React.MutableRefObject<DragState>
  panCurrentRef: React.MutableRefObject<Vector2>
  panTargetRef: React.MutableRefObject<Vector2>
  panVelocityRef: React.MutableRefObject<Vector2>
  zoomCurrentRef: React.MutableRefObject<number>
  zoomTargetRef: React.MutableRefObject<number>
  preferPreview: boolean
}

function ArchiveScene({
  layout,
  onSelect,
  dragStateRef,
  panCurrentRef,
  panTargetRef,
  panVelocityRef,
  zoomCurrentRef,
  zoomTargetRef,
  preferPreview,
}: ArchiveSceneProps) {
  const groupRef = React.useRef<Group>(null)

  useFrame((state, delta) => {
    if (!dragStateRef.current.active) {
      const decay = Math.pow(INERTIA_FRICTION, delta * 60)
      panVelocityRef.current.multiplyScalar(decay)

      if (panVelocityRef.current.lengthSq() > 0.00001) {
        panTargetRef.current.x += panVelocityRef.current.x * delta * 60
        panTargetRef.current.y += panVelocityRef.current.y * delta * 60

        panTargetRef.current.x = clamp(
          panTargetRef.current.x,
          -PAN_BOUNDS.x,
          PAN_BOUNDS.x
        )
        panTargetRef.current.y = clamp(
          panTargetRef.current.y,
          -PAN_BOUNDS.y,
          PAN_BOUNDS.y
        )
      } else {
        panVelocityRef.current.set(0, 0)
      }
    }

    panCurrentRef.current.x = MathUtils.damp(
      panCurrentRef.current.x,
      panTargetRef.current.x,
      6,
      delta
    )
    panCurrentRef.current.y = MathUtils.damp(
      panCurrentRef.current.y,
      panTargetRef.current.y,
      6,
      delta
    )

    if (groupRef.current) {
        groupRef.current.position.x = 0
        groupRef.current.position.y = 0
        groupRef.current.rotation.x = MathUtils.damp(
          groupRef.current.rotation.x,
          0,
          4,
          delta
        )
        groupRef.current.rotation.y = MathUtils.damp(
          groupRef.current.rotation.y,
          0,
          4,
          delta
        )
    }

    zoomCurrentRef.current = MathUtils.damp(
      zoomCurrentRef.current,
      zoomTargetRef.current,
      5,
      delta
    )

    state.camera.position.x = MathUtils.damp(
      state.camera.position.x,
      panCurrentRef.current.x,
      6,
      delta
    )
    state.camera.position.y = MathUtils.damp(
      state.camera.position.y,
      panCurrentRef.current.y,
      6,
      delta
    )
    state.camera.position.z = MathUtils.damp(
      state.camera.position.z,
      zoomCurrentRef.current,
      5,
      delta
    )
    state.camera.lookAt(state.camera.position.x, state.camera.position.y, 0)

      const needsUpdate =
      dragStateRef.current.active ||
      panVelocityRef.current.lengthSq() > 0.00001 ||
      Math.abs(panCurrentRef.current.x - panTargetRef.current.x) > 0.001 ||
      Math.abs(panCurrentRef.current.y - panTargetRef.current.y) > 0.001 ||
      Math.abs(zoomCurrentRef.current - zoomTargetRef.current) > 0.001

      if (needsUpdate) {
        state.invalidate()
      }
  })

  return (
    <group ref={groupRef}>
      {layout.map((item) => (
        <ImageNode
          key={item.image.id}
          image={item.image}
          position={item.position}
          rotationZ={item.tilt}
          onSelect={onSelect}
          dragState={dragStateRef}
          preferPreview={preferPreview}
        />
      ))}
    </group>
  )
}
