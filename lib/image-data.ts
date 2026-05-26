export type ImageItem = {
  id: string
  url: string
  previewUrl?: string
  thumbUrl?: string
  modalUrl?: string
  width: number
  height: number
  title?: string
  description?: string
}

type RawImageItem = Omit<ImageItem, "url" | "thumbUrl" | "modalUrl"> & {
  path: string
}

const imageSource = (process.env.NEXT_PUBLIC_IMAGE_SOURCE || "placeholder").toLowerCase()
const baseUrl = (process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "").replace(/\/$/, "")

const rawItems: RawImageItem[] = [
  {
    id: "img-01",
    path: "archive/01.jpg",
    width: 1600,
    height: 1000,
    title: "Streetlight",
    description: "A late walk under a soft orange glow.",
  },
  {
    id: "img-02",
    path: "archive/02.jpg",
    width: 1500,
    height: 1000,
    title: "Skyline",
    description: "Buildings stacked like notes on a staff.",
  },
  {
    id: "img-03",
    path: "archive/03.jpg",
    width: 1400,
    height: 900,
    title: "Market",
    description: "Quick faces and bright colors in motion.",
  },
  {
    id: "img-04",
    path: "archive/04.jpg",
    width: 1200,
    height: 800,
    title: "Window",
    description: "Reflections folding the room into itself.",
  },
  {
    id: "img-05",
    path: "archive/05.jpg",
    width: 1300,
    height: 900,
    title: "Bridge",
    description: "Steel lines cutting through pale light.",
  },
  {
    id: "img-06",
    path: "archive/06.jpg",
    width: 1100,
    height: 800,
    title: "Corner",
    description: "A quiet corner holding its breath.",
  },
  {
    id: "img-07",
    path: "archive/07.jpg",
    width: 1000,
    height: 1500,
    title: "Portrait",
    description: "Eyes catching the frame for a second.",
  },
  {
    id: "img-08",
    path: "archive/08.jpg",
    width: 900,
    height: 1300,
    title: "Stairs",
    description: "Steps climbing into shadow.",
  },
  {
    id: "img-09",
    path: "archive/09.jpg",
    width: 1400,
    height: 900,
    title: "Rain",
    description: "Wet pavement reflecting the city.",
  },
  {
    id: "img-10",
    path: "archive/10.jpg",
    width: 1200,
    height: 800,
    title: "Portrait",
    description: "A glance that lingers longer than it should.",
  },
  {
    id: "img-11",
    path: "archive/11.jpg",
    width: 1500,
    height: 1000,
    title: "Train",
    description: "Motion blur and the echo of tracks.",
  },
  {
    id: "img-12",
    path: "archive/12.jpg",
    width: 1300,
    height: 900,
    title: "Cafe",
    description: "A warm light at the edge of night.",
  },
  {
    id: "img-13",
    path: "archive/13.jpg",
    width: 1200,
    height: 1800,
    title: "Portrait",
    description: "Soft grain and a long afternoon.",
  },
  {
    id: "img-14",
    path: "archive/14.jpg",
    width: 1400,
    height: 900,
    title: "Signage",
    description: "Letters humming over a narrow street.",
  },
  {
    id: "img-15",
    path: "archive/15.jpg",
    width: 1600,
    height: 1000,
    title: "Traffic",
    description: "Headlights threading the dusk.",
  },
  {
    id: "img-16",
    path: "archive/16.jpg",
    width: 1200,
    height: 800,
    title: "Shadow",
    description: "A sharp line slicing through noon.",
  },
  {
    id: "img-17",
    path: "archive/17.jpg",
    width: 1500,
    height: 1000,
    title: "Apartment",
    description: "Balconies stacked like diaries.",
  },
  {
    id: "img-18",
    path: "archive/18.jpg",
    width: 1200,
    height: 1800,
    title: "Portrait",
    description: "A still frame with a quiet pulse.",
  },
  {
    id: "img-19",
    path: "archive/19.jpg",
    width: 1400,
    height: 900,
    title: "Park",
    description: "Leaves and shadows in loose geometry.",
  },
  {
    id: "img-20",
    path: "archive/20.jpg",
    width: 1300,
    height: 900,
    title: "Facade",
    description: "Concrete layers catching late light.",
  },
  {
    id: "img-21",
    path: "archive/21.jpg",
    width: 1500,
    height: 1000,
    title: "Bus Stop",
    description: "Muted colors under a cloudy sky.",
  },
  {
    id: "img-22",
    path: "archive/22.jpg",
    width: 1200,
    height: 800,
    title: "Cafe",
    description: "A table set for a story.",
  },
  {
    id: "img-23",
    path: "archive/23.jpg",
    width: 1100,
    height: 800,
    title: "Alley",
    description: "A narrow lane with soft neon.",
  },
  {
    id: "img-24",
    path: "archive/24.jpg",
    width: 1400,
    height: 900,
    title: "Night",
    description: "A quiet glow beyond the frame.",
  },
]

function buildUrl(path: string, seed: string, width: number, height: number) {
  if (imageSource === "spaces" && baseUrl) {
    return `${baseUrl}/${path}`
  }

  return `https://picsum.photos/seed/${seed}/${width}/${height}`
}

export function getImageItems(): ImageItem[] {
  return rawItems.map((item) => {
    const thumbWidth = Math.min(900, item.width)
    const thumbHeight = Math.round((thumbWidth / item.width) * item.height)
    const previewWidth = Math.min(640, item.width)
    const previewHeight = Math.round((previewWidth / item.width) * item.height)
    const modalWidth = Math.min(1600, item.width)
    const modalHeight = Math.round((modalWidth / item.width) * item.height)

    return {
      id: item.id,
      url: buildUrl(item.path, item.id, item.width, item.height),
      previewUrl: buildUrl(
        item.path,
        `${item.id}-preview`,
        previewWidth,
        previewHeight
      ),
      thumbUrl: buildUrl(item.path, `${item.id}-thumb`, thumbWidth, thumbHeight),
      modalUrl: buildUrl(item.path, `${item.id}-modal`, modalWidth, modalHeight),
      width: item.width,
      height: item.height,
      title: item.title,
      description: item.description,
    }
  })
}
