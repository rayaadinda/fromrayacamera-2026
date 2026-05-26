"use client"

import * as React from "react"
import Image from "next/image"
import { Pause, Play, SkipBack, SkipForward, Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

type Track = {
  id: string
  title: string
  artist?: string
  album?: string
  year?: string
  cover?: string
  src: string
}

type MusicPlayerProps = {
  tracks?: Track[]
}

const defaultTracks: Track[] = [
  {
    id: "track-1",
    title: "One More Light",
    artist: "Rebelion",
    album: "The Final Dose",
    year: "2025",
    cover: "/cover/one-more-light.jpeg",
    src: "/audio/one-more-light.mp3",
  },
  {
    id: "track-2",
    title: "Night Walk",
    artist: "Still Frames",
    album: "City Afterglow",
    year: "2024",
    src: "/audio/track-2.mp3",
  },
  {
    id: "track-3",
    title: "Slow Light",
    artist: "Mono Arc",
    album: "Soft Static",
    year: "2023",
    src: "/audio/track-3.mp3",
  },
]

function getInitials(title?: string) {
  if (!title) {
    return "FM"
  }
  const words = title.split(" ").filter(Boolean)
  if (words.length === 0) {
    return "FM"
  }
  const initials = words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
  return initials.toUpperCase()
}

export function MusicPlayer({ tracks = defaultTracks }: MusicPlayerProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [hasError, setHasError] = React.useState(false)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const shouldAutoplayRef = React.useRef(false)

  const activeTrack = tracks[currentIndex]
  const hasTracks = tracks.length > 0 && Boolean(activeTrack)
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleNext = React.useCallback(() => {
    if (!hasTracks) {
      return
    }
    shouldAutoplayRef.current = isPlaying
    setCurrentIndex((prev) => (prev + 1) % tracks.length)
  }, [hasTracks, isPlaying, tracks.length])

  const handlePrev = React.useCallback(() => {
    if (!hasTracks) {
      return
    }
    shouldAutoplayRef.current = isPlaying
    setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length)
  }, [hasTracks, isPlaying, tracks.length])

  const handleToggle = React.useCallback(async () => {
    const audio = audioRef.current
    if (!audio || !hasTracks) {
      return
    }

    if (audio.paused) {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch {
        setIsPlaying(false)
      }
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }, [hasTracks])

  const handleStop = React.useCallback(() => {
    const audio = audioRef.current
    if (!audio || !hasTracks) {
      return
    }
    audio.pause()
    audio.currentTime = 0
    setCurrentTime(0)
    setIsPlaying(false)
  }, [hasTracks])

  const handleSeek = React.useCallback(
    (value: number[]) => {
      const audio = audioRef.current
      if (!audio || duration === 0) {
        return
      }
      const nextTime = (value[0] / 100) * duration
      audio.currentTime = nextTime
      setCurrentTime(nextTime)
    },
    [duration]
  )

  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio || !activeTrack) {
      return
    }

    audio.src = activeTrack.src
    audio.load()
    setCurrentTime(0)
    setDuration(0)
    setHasError(false)

    if (shouldAutoplayRef.current) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false))
    } else {
      setIsPlaying(false)
    }

    shouldAutoplayRef.current = false
  }, [activeTrack])

  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    function handleLoaded() {
      const currentAudio = audioRef.current
      if (!currentAudio) {
        return
      }
      setDuration(currentAudio.duration || 0)
    }

    function handleTimeUpdate() {
      const currentAudio = audioRef.current
      if (!currentAudio) {
        return
      }
      setCurrentTime(currentAudio.currentTime || 0)
    }

    function handleEnded() {
      handleNext()
    }

    function handleError() {
      setHasError(true)
    }

    audio.addEventListener("loadedmetadata", handleLoaded)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
    }
  }, [handleNext])

  return (
    <div
      className="pointer-events-auto fixed bottom-4 left-4 z-40 w-64"
      onPointerDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      <div className="rounded-lg bg-white/90 px-2.5 py-1.5">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-md bg-neutral-800">
            {activeTrack?.cover ? (
              <Image
                src={activeTrack.cover}
                alt={activeTrack?.title ?? "Track cover"}
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-amber-500 via-rose-500 to-emerald-500 text-[0.5rem] font-semibold uppercase text-white">
                {getInitials(activeTrack?.title)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.7rem] font-medium text-neutral-900">
              {activeTrack?.title ?? "No tracks"}
            </p>
            <Slider
              size="sm"
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              className="mt-1"
              trackClassName="bg-neutral-200"
              rangeClassName="bg-neutral-900"
              thumbClassName="bg-black"
              disabled={!hasTracks}
            />
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-neutral-700 hover:bg-black/5 hover:text-neutral-900"
              onClick={handlePrev}
              disabled={!hasTracks}
            >
              <SkipBack className="h-2.5 w-2.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-neutral-700 hover:bg-black/5 hover:text-neutral-900"
              onClick={handleToggle}
              disabled={!hasTracks || hasError}
            >
              {isPlaying ? (
                <Pause className="h-2.5 w-2.5" />
              ) : (
                <Play className="h-2.5 w-2.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-neutral-700 hover:bg-black/5 hover:text-neutral-900"
              onClick={handleStop}
              disabled={!hasTracks}
            >
              <Square className="h-2.5 w-2.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-neutral-700 hover:bg-black/5 hover:text-neutral-900"
              onClick={handleNext}
              disabled={!hasTracks}
            >
              <SkipForward className="h-2.5 w-2.5" />
            </Button>
          </div>
        </div>
        {hasError ? (
          <p className="mt-1 text-[0.55rem] text-rose-400">Audio missing</p>
        ) : null}
      </div>

      <audio ref={audioRef} preload="metadata" />
    </div>
  )
}
