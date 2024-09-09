import React from "react"
import { PlatformEnum } from "api"

type PlatformObject = {
  name: string
  image: string | null
}

export const PLATFORMS: Record<PlatformEnum, PlatformObject> = {
  [PlatformEnum.Ocw]: {
    name: "MIT OpenCourseWare",
    image: "/unit_logos/ocw.svg",
  },
  [PlatformEnum.Edx]: {
    name: "edX",
    image: "/platform_logos/edx.svg",
  },
  [PlatformEnum.Mitxonline]: {
    name: "MITx Online",
    image: "/unit_logos/mitx.svg",
  },
  [PlatformEnum.Bootcamps]: {
    name: "Bootcamps",
    image: "/platform_logos/bootcamps.svg",
  },
  [PlatformEnum.Xpro]: {
    name: "MIT xPRO",
    image: "/unit_logos/xpro.svg",
  },
  [PlatformEnum.Podcast]: {
    name: "Podcast",
    image: null,
  },
  [PlatformEnum.Csail]: {
    name: "CSAIL",
    image: "/platform_logos/csail.svg",
  },
  [PlatformEnum.Mitpe]: {
    name: "MIT Professional Education",
    image: null,
  },
  [PlatformEnum.See]: {
    name: "MIT Sloan Executive Education",
    image: "/unit_logos/see.svg",
  },
  [PlatformEnum.Scc]: {
    name: "Schwarzman College of Computing",
    image: null,
  },
  [PlatformEnum.Ctl]: {
    name: "Center for Transportation & Logistics",
    image: null,
  },
  [PlatformEnum.Emeritus]: {
    name: "Emeritus",
    image: null,
  },
  [PlatformEnum.Simplilearn]: {
    name: "Simplilearn",
    image: null,
  },
  [PlatformEnum.Globalalumni]: {
    name: "Global Alumni",
    image: null,
  },
  [PlatformEnum.Susskind]: {
    name: "Susskind",
    image: null,
  },
  [PlatformEnum.Whu]: {
    name: "WHU",
    image: null,
  },
  [PlatformEnum.Oll]: {
    name: "Open Learning Library",
    image: "/platform_logos/oll.svg",
  },
  [PlatformEnum.Youtube]: {
    name: "YouTube",
    image: null,
  },
}

export const PlatformLogo: React.FC<{
  platformCode?: PlatformEnum
  className?: string
}> = ({ platformCode, className }) => {
  const platform = PLATFORMS[platformCode!]
  if (!platform?.image) {
    return null
  }
  return (
    <img
      src={`/images${platform?.image}`}
      className={className}
      alt={platform.name}
    />
  )
}
