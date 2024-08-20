import React from "react"
import { PlatformEnum } from "api"

type PlatformObject = {
  name: string
  image: string | null
}

export const PLATFORMS: Record<PlatformEnum, PlatformObject> = {
  [PlatformEnum.Ocw]: {
    name: "MIT OpenCourseWare",
    image: "ocw-logo.png",
  },
  [PlatformEnum.Edx]: {
    name: "edX",
    image: "edx_logo.svg",
  },
  [PlatformEnum.Mitxonline]: {
    name: "MITx Online",
    image: "mitx-online-logo.svg",
  },
  [PlatformEnum.Bootcamps]: {
    name: "Bootcamps",
    image: "bootcamps_logo.svg",
  },
  [PlatformEnum.Xpro]: {
    name: "MIT xPRO",
    image: "xpro.svg",
  },
  [PlatformEnum.Podcast]: {
    name: "Podcast",
    image: null,
  },
  [PlatformEnum.Csail]: {
    name: "CSAIL",
    image: "csail_logo.svg",
  },
  [PlatformEnum.Mitpe]: {
    name: "MIT Professional Education",
    image: null,
  },
  [PlatformEnum.See]: {
    name: "MIT Sloan Executive Education",
    image: "see.svg",
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
    image: "oll_logo.svg",
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
      src={`/images/platform_logos/${platform?.image}`}
      className={className}
      alt={platform.name}
    />
  )
}
