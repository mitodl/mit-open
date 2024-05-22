import React from "react"

const PLATFORMS = [
  {
    code: "ocw",
    name: "OCW",
    image: "mit-ocw-logo-square.png",
  },
  {
    code: "edx",
    name: "edX",
    image: "edx_logo.png",
  },
  {
    code: "mitxonline",
    name: "MITx Online",
    image: "mitx-online-logo.png",
  },
  {
    code: "bootcamps",
    name: "Bootcamps",
    image: null,
  },
  {
    code: "xpro",
    name: "xPRO",
    image: "mit-xpro-logo.png",
  },
  {
    code: "podcast",
    name: "Podcast",
    image: null,
  },
  {
    code: "csail",
    name: "CSAIL",
    image: "csail-logo.png",
  },
  {
    code: "mitpe",
    name: "MIT Professional Education",
    image: null,
  },
  {
    code: "see",
    name: "Sloan Executive Education",
    image: "sloan-logo.png",
  },
  {
    code: "scc",
    name: "Schwarzman College of Computing",
    image: null,
  },
  {
    code: "ctl",
    name: "Center for Transportation & Logistics",
    image: null,
  },
  {
    code: "emeritus",
    name: "Emeritus",
    image: null,
  },
  {
    code: "simplilearn",
    name: "Simplilearn",
    image: null,
  },
  {
    code: "globalalumni",
    name: "Global Alumni",
    image: null,
  },
  {
    code: "susskind",
    name: "Susskind",
    image: null,
  },
  {
    code: "whu",
    name: "WHU",
    image: null,
  },
  {
    code: "oll",
    name: "Open Learning Library",
    image: "oll_logo.png",
  },
  {
    code: "youtube",
    name: "YouTube",
    image: null,
  },
]

export const PlatformLogo: React.FC<{
  platformCode?: string
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
