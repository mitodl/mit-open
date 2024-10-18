import React from "react"
import UnitChannelTemplate from "./UnitChannelTemplate"
import DefaultChannelTemplate from "./DefaultChannelTemplate"
import { ChannelTypeEnum } from "api/v0"
import {
  DEPARTMENTS as DEPARTMENTS_URL,
  TOPICS as TOPICS_URL,
  UNITS as UNITS_URL,
} from "@/common/urls"
import { styled } from "ol-components"
import TopicChannelTemplate from "./TopicChannelTemplate"

const TOPICS_LABEL = "Browse by Topic"
const DEPARTMENTS_LABEL = "Browse by Academic Department"
const UNITS_LABEL = "MIT Units"
const PATHWAYS_LABEL = "Pathways"

const CHANNEL_TYPE_BREADCRUMB_TARGETS: {
  [key: string]: { href: string; label: string }
} = {
  topic: {
    href: TOPICS_URL,
    label: TOPICS_LABEL,
  },
  department: {
    href: DEPARTMENTS_URL,
    label: DEPARTMENTS_LABEL,
  },
  unit: {
    href: UNITS_URL,
    label: UNITS_LABEL,
  },
  pathway: {
    href: "",
    label: PATHWAYS_LABEL,
  },
}

const ChannelTitleRow = styled.div({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",

  h1: {
    a: {
      "&:hover": {
        textDecoration: "none",
      },
    },
  },
})

const ChannelControls = styled.div({
  position: "relative",
  minHeight: "38px",
  display: "flex",
})

interface ChannelSkeletonProps {
  children: React.ReactNode
  channelType: string
  name: string
}

/**
 * Common structure for channel-oriented pages.
 *
 * Renders the channel title and avatar in a banner.
 */
const ChannelPageTemplate: React.FC<ChannelSkeletonProps> = ({
  children,
  channelType,
  name,
}) => {
  const getChannelTemplate = (channelType: string) => {
    switch (channelType) {
      case ChannelTypeEnum.Unit:
        return UnitChannelTemplate
      case ChannelTypeEnum.Topic:
        return TopicChannelTemplate
      default:
        return DefaultChannelTemplate
    }
  }
  const ChannelTemplate = getChannelTemplate(channelType)

  return (
    <ChannelTemplate name={name} channelType={channelType}>
      {children}
    </ChannelTemplate>
  )
}

export {
  ChannelPageTemplate,
  ChannelTitleRow,
  ChannelControls,
  CHANNEL_TYPE_BREADCRUMB_TARGETS,
  UNITS_LABEL,
  TOPICS_LABEL,
  DEPARTMENTS_LABEL,
  PATHWAYS_LABEL,
}
