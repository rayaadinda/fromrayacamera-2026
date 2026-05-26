"use client"

import * as React from "react"
import { useThree } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"
import { SRGBColorSpace, type Texture } from "three"

import type { ImageItem } from "@/lib/image-data"

export type DragState = {
  active: boolean
  dragged: boolean
}

type ImageNodeProps = {
  image: ImageItem
  position: [number, number, number]
  rotationZ?: number
  onSelect: (image: ImageItem) => void
  dragState: React.MutableRefObject<DragState>
  onLoaded?: () => void
}

export function ImageNode({
  image,
  position,
  rotationZ = 0,
  onSelect,
  dragState,
  onLoaded,
}: ImageNodeProps) {
  const textureUrl = image.thumbUrl ?? image.url
  const texture = useTexture(textureUrl) as Texture
  const { gl, invalidate } = useThree()
  const hasNotifiedRef = React.useRef(false)

  const configuredTexture = React.useMemo(() => {
    const cloned = texture.clone()
    cloned.colorSpace = SRGBColorSpace
    cloned.anisotropy = gl.capabilities.getMaxAnisotropy()
    cloned.needsUpdate = true
    return cloned
  }, [gl, texture])

  React.useEffect(() => {
    invalidate()

    if (onLoaded && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true
      onLoaded()
    }

    return () => {
      configuredTexture.dispose()
    }
  }, [configuredTexture, invalidate, onLoaded])

  const scale = React.useMemo(() => {
    const aspect = image.width / image.height
    const base = 1.35

    if (aspect >= 1) {
      return [base * aspect, base, 1] as [number, number, number]
    }

    return [base, base / aspect, 1] as [number, number, number]
  }, [image.height, image.width])

  const handlePointerOver = React.useCallback(() => {
    document.body.style.cursor = "pointer"
  }, [])

  const handlePointerOut = React.useCallback(() => {
    document.body.style.cursor = ""
  }, [])

  return (
    <mesh
      position={position}
      rotation={[0, 0, rotationZ]}
      scale={scale}
      onClick={(event) => {
        event.stopPropagation()
        if (dragState.current.dragged) {
          return
        }
        onSelect(image)
      }}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={configuredTexture} toneMapped={false} />
    </mesh>
  )
}
