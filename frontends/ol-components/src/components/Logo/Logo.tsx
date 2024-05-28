import React from "react"
import { PlatformEnum } from "api"

export const PLATFORMS = [
  {
    code: PlatformEnum.Ocw,
    name: "OCW",
    image: "mit-ocw-logo-square.png",
  },
  {
    code: PlatformEnum.Edx,
    name: "edX",
    image: "edx_logo.png",
  },
  {
    code: PlatformEnum.Mitxonline,
    name: "MITx Online",
    image: "mitx-online-logo.png",
  },
  {
    code: PlatformEnum.Bootcamps,
    name: "Bootcamps",
    image: null,
  },
  {
    code: PlatformEnum.Xpro,
    name: "xPRO",
    image: "mit-xpro-logo.png",
  },
  {
    code: PlatformEnum.Podcast,
    name: "Podcast",
    image: null,
  },
  {
    code: PlatformEnum.Csail,
    name: "CSAIL",
    image: "csail-logo.png",
  },
  {
    code: PlatformEnum.Mitpe,
    name: "MIT Professional Education",
    image: null,
  },
  {
    code: PlatformEnum.See,
    name: "Sloan Executive Education",
    image: "sloan-logo.png",
  },
  {
    code: PlatformEnum.Scc,
    name: "Schwarzman College of Computing",
    image: null,
  },
  {
    code: PlatformEnum.Ctl,
    name: "Center for Transportation & Logistics",
    image: null,
  },
  {
    code: PlatformEnum.Emeritus,
    name: "Emeritus",
    image: null,
  },
  {
    code: PlatformEnum.Simplilearn,
    name: "Simplilearn",
    image: null,
  },
  {
    code: PlatformEnum.Globalalumni,
    name: "Global Alumni",
    image: null,
  },
  {
    code: PlatformEnum.Susskind,
    name: "Susskind",
    image: null,
  },
  {
    code: PlatformEnum.Whu,
    name: "WHU",
    image: null,
  },
  {
    code: PlatformEnum.Oll,
    name: "Open Learning Library",
    image: "oll_logo.png",
  },
  {
    code: PlatformEnum.Youtube,
    name: "YouTube",
    image: null,
  },
]

export const PlatformLogo: React.FC<{
  platformCode?: PlatformEnum
  className?: string
}> = ({ platformCode, className }) => {
  const platform = PLATFORMS.find((platform) => platform.code === platformCode)
  if (!platform?.image) {
    return null
  }
  return (
    <img
      src={`/static/images/${platform?.image}`}
      className={className}
      alt={platform.name}
    />
  )
}
