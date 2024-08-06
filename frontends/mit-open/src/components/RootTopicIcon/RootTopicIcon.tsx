import {
  RiTestTubeLine,
  RiUserSearchLine,
  RiLightbulbFlashLine,
  RiBriefcase3Line,
  RiStethoscopeLine,
  RiPaletteLine,
  RiQuillPenLine,
  RiShakeHandsLine,
  RiRobot2Line,
  RiEarthLine,
  RiSpaceShipLine,
} from "@remixicon/react"
import React from "react"

export const ICON_MAP = {
  RiTestTubeLine: RiTestTubeLine,
  RiUserSearchLine: RiUserSearchLine,
  RiLightbulbFlashLine: RiLightbulbFlashLine,
  RiBriefcase3Line: RiBriefcase3Line,
  RiStethoscopeLine: RiStethoscopeLine,
  RiPaletteLine: RiPaletteLine,
  RiQuillPenLine: RiQuillPenLine,
  RiShakeHandsLine: RiShakeHandsLine,
  RiRobot2Line: RiRobot2Line,
  RiEarthLine: RiEarthLine,
  RiSpaceShipLine: RiSpaceShipLine,
}

type RootTopicIconProps = { icon: string | undefined }

/**
 * Render an icon for a root-level topic.
 *
 * NOTE: These icons are hardcoded. This isn't ideal, but:
 *  1. Topics are not expected to change frequently.
 *  2. There are only about a dozen root-level topics.
 *  3. We have a test in place to ensure all root-level topics have an icon.
 */
const RootTopicIcon: React.FC<RootTopicIconProps> = ({ icon }) => {
  const Icon = ICON_MAP[icon as keyof typeof ICON_MAP]
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
