import {
  RiPaletteLine,
  RiSeedlingLine,
  RiBriefcaseLine,
  RiMacbookLine,
  RiBarChartBoxLine,
  RiEarthLine,
  RiLightbulbLine,
  RiBuildingLine,
  RiServiceLine,
  RiQuillPenLine,
  RiMicroscopeLine,
} from "@remixicon/react"
import React from "react"

/* TODO Using any icons until we have a solution for specifying them */
const ICON_MAP = {
  Business: RiBriefcaseLine,
  Energy: RiLightbulbLine,
  Engineering: RiBuildingLine,
  "Fine Arts": RiPaletteLine,
  "Health and Medicine": RiServiceLine,
  Humanities: RiQuillPenLine,
  Mathematics: RiBarChartBoxLine,
  Science: RiMicroscopeLine,
  "Social Science": RiSeedlingLine,
  Society: RiEarthLine,
  "Teaching and Education": RiMacbookLine,
}

type RootTopicIconProps = { name: string }

/**
 * Render an icon for a root-level topic.
 *
 * NOTE: These icons are hardcoded. This isn't ideal, but:
 *  1. Topics are not expected to change frequently.
 *  2. There are only about a dozen root-level topics.
 *  3. We have a test in place to ensure all root-level topics have an icon.
 */
const RootTopicIcon: React.FC<RootTopicIconProps> = ({ name }) => {
  const Icon = ICON_MAP[name as keyof typeof ICON_MAP]
  if (Icon) {
    return <Icon aria-hidden="true" />
  } else {
    /**
     * If no icon is found, display nothing. Use visibility: hidden so that the
     * icon still takes up space in the layout.
     */
    return <RiEarthLine aria-hidden="true" style={{ visibility: "hidden" }} />
  }
}

export default RootTopicIcon
