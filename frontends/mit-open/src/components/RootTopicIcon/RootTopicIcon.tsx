import {
  RiPaletteLine,
  RiShakeHandsLine,
  RiEarthLine,
  RiQuillPenLine,
  RiBriefcase3Line,
  RiLightbulbFlashLine,
  RiRobot2Line,
  RiStethoscopeLine,
  RiInfinityLine,
  RiTestTubeLine,
  RiUserSearchLine,
  RiTeamLine,
  RiLineChartLine,
} from "@remixicon/react"
import React from "react"

/* TODO Using any icons until we have a solution for specifying them */
export const ICON_MAP = {
  "Business & Management": RiBriefcase3Line,
  "Energy, Climate & Sustainability": RiLightbulbFlashLine,
  "Data Science, Analytics & Computer Technology": RiLineChartLine,
  "Art, Design & Architecture": RiPaletteLine,
  "Health & Medicine": RiStethoscopeLine,
  Humanities: RiQuillPenLine,
  Mathematics: RiInfinityLine,
  "Science & Math": RiTestTubeLine,
  "Social Sciences": RiUserSearchLine,
  Society: RiEarthLine,
  "Education & Teaching": RiShakeHandsLine,
  Engineering: RiRobot2Line,
  "Innovation & Entrepreneurship": RiTeamLine,
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
