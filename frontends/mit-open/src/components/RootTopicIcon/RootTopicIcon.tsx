import {
  RiPaletteLine,
  RiSeedlingLine,
  RiEarthLine,
  RiQuillPenLine,
  RiBriefcase3Line,
  RiLightbulbFlashLine,
  RiRobot2Line,
  RiStethoscopeLine,
  RiInfinityLine,
  RiTestTubeLine,
  RiUserSearchLine,
} from "@remixicon/react"
import React from "react"

/* TODO Using any icons until we have a solution for specifying them */
const ICON_MAP = {
  Business: RiBriefcase3Line,
  Energy: RiLightbulbFlashLine,
  Engineering: RiRobot2Line,
  "Fine Arts": RiPaletteLine,
  "Health and Medicine": RiStethoscopeLine,
  Humanities: RiQuillPenLine,
  Mathematics: RiInfinityLine,
  Science: RiTestTubeLine,
  "Social Science": RiUserSearchLine,
  Society: RiEarthLine,
  "Teaching and Education": RiSeedlingLine,
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
