"use client"

/* eslint-disable react-hooks/immutability */

import * as React from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"
import {
  LinearFilter,
  MathUtils,
  SRGBColorSpace,
  type MeshBasicMaterial,
  type Texture,
} from "three"

import type { ImageItem } from "@/lib/image-data"

export type DragState = {
  active: boolean
  dragged: boolean
}

type ImageNodeProps = {
  image: ImageItem
  position: [number, number, number]
  rotationZ?: number
  preferPreview?: boolean
  onSelect: (image: ImageItem) => void
  dragState: React.MutableRefObject<DragState>
}

export function ImageNode({
  image,
  position,
  rotationZ = 0,
  preferPreview = false,
  onSelect,
  dragState,
}: ImageNodeProps) {
  const textureUrl = preferPreview
    ? image.previewUrl ?? image.thumbUrl ?? image.url
    : image.thumbUrl ?? image.previewUrl ?? image.url
  const useLowResTexture = textureUrl !== image.url
  const texture = useTexture(textureUrl) as Texture
  const { invalidate } = useThree()
  const materialRef = React.useRef<MeshBasicMaterial>(null)
  const opacityRef = React.useRef(0)

  React.useEffect(() => {
    // Three textures are mutable GPU resources; configure the cached texture in place.
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 1

    if (useLowResTexture) {
      texture.generateMipmaps = false
      texture.minFilter = LinearFilter
    }

    texture.needsUpdate = true
    opacityRef.current = 0
    if (materialRef.current) {
      materialRef.current.opacity = 0
    }
    invalidate()
  }, [invalidate, texture, useLowResTexture])

  useFrame((state, delta) => {
    if (!materialRef.current || opacityRef.current >= 0.995) {
      return
    }

    opacityRef.current = MathUtils.damp(opacityRef.current, 1, 5, delta)
    materialRef.current.opacity = opacityRef.current
    state.invalidate()
  })

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
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        opacity={0}
        toneMapped={false}
        transparent
      />
    </mesh>
  )
}
