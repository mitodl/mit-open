import React from "react"
import UnitChannelSkeleton from "./UnitChannelSkeleton"
import DefaultChannelSkeleton from "./DefaultChannelSkeleton"
import { ChannelTypeEnum } from "api/v0"

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
const ChannelSkeletonProps: React.FC<ChannelSkeletonProps> = ({
  children,
  channelType,
  name,
}) => {
  const SkeletonTemplate =
    channelType === ChannelTypeEnum.Unit
      ? UnitChannelSkeleton
      : DefaultChannelSkeleton

  return (
    <SkeletonTemplate name={name} channelType={channelType}>
      {children}
    </SkeletonTemplate>
  )
}

export default ChannelSkeletonProps
