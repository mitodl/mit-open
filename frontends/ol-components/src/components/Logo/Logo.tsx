import React from "react"
import { PlatformEnum } from "api"
import Image from "next/image"


type WithImage = {
  name: string
  image: string
  aspect: number
}

type WithoutImage = {
  name: string
  image?: null
}

type PlatformObject = WithImage | WithoutImage

export const PLATFORMS: Record<PlatformEnum, PlatformObject> = {
  [PlatformEnum.Ocw]: {
    name: "MIT OpenCourseWare",
    image: "/unit_logos/ocw.svg",
    aspect: 6.03
  },
  [PlatformEnum.Edx]: {
    name: "edX",
    image: "/platform_logos/edx.svg",
    aspect: 1.77
  },
  [PlatformEnum.Mitxonline]: {
    name: "MITx Online",
    image: "/unit_logos/mitx.svg",
    aspect: 3.32
  },
  [PlatformEnum.Bootcamps]: {
    name: "Bootcamps",
    image: "/platform_logos/bootcamps.svg",
    aspect: 5.25
  },
  [PlatformEnum.Xpro]: {
    name: "MIT xPRO",
    image: "/unit_logos/xpro.svg",
    aspect: 3.56
  },
  [PlatformEnum.Podcast]: {
    name: "Podcast",
  },
  [PlatformEnum.Csail]: {
    name: "CSAIL",
    image: "/platform_logos/csail.svg",
    aspect: 1.76
  },
  [PlatformEnum.Mitpe]: {
    name: "MIT Professional Education",
  },
  [PlatformEnum.See]: {
    name: "MIT Sloan Executive Education",
    image: "/unit_logos/see.svg",
    aspect: 7.73
  },
  [PlatformEnum.Scc]: {
    name: "Schwarzman College of Computing",
  },
  [PlatformEnum.Ctl]: {
    name: "Center for Transportation & Logistics",
  },
  [PlatformEnum.Emeritus]: {
    name: "Emeritus",
  },
  [PlatformEnum.Simplilearn]: {
    name: "Simplilearn",
  },
  [PlatformEnum.Globalalumni]: {
    name: "Global Alumni",
  },
  [PlatformEnum.Susskind]: {
    name: "Susskind",
  },
  [PlatformEnum.Whu]: {
    name: "WHU",
  },
  [PlatformEnum.Oll]: {
    name: "Open Learning Library",
    image: "/platform_logos/oll.svg",
    aspect: 5.25
  },
  [PlatformEnum.Youtube]: {
    name: "YouTube",
  },
}

const DEFAULT_WIDTH = 200

export const PlatformLogo: React.FC<{
  platformCode?: PlatformEnum
  className?: string
  width?: number
  height?: number
}> = ({ platformCode, className, width, height }) => {
  const platform = PLATFORMS[platformCode!]
  if (!platform?.image) {
    return null
  }

  /* The Next.js Image component's requirement to specify both width and height are peculiar
   * in the context of SVG images that do not optimize. Likely to ensure no layout shift,
   * though for such a hard error ("Image is missing required width property"), the layout
   * doesn't necessarily shift, depending on the image placement and can be prevented with CSS.
   * The @next/next/no-img-element lint rule does not have any escape for SVGs despite the warning
   * not actually applying - "Using `<img>` could result in slower LCP and higher bandwidth.".
   */
  if (width && !height) {
    height = width / platform.aspect
  }
  if (!width && height) {
    width = height * platform.aspect
  }
  if (!width) {
    width = DEFAULT_WIDTH
    height = width / platform.aspect
  }

  return (
    <Image
      src={`/images${platform?.image}`}
      className={className}
      alt={platform.name}
      width={width}
      height={height}
    />
  )
}
