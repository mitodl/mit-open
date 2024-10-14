"use client"

import React from "react"
import LearningResourceDrawer from "@/page-components/LearningResourceDrawer/LearningResourceDrawer"
import { useParams } from "next/navigation"
import { ChannelPageTemplate } from "./ChannelPageTemplate"
import { useChannelDetail } from "api/hooks/channels"
import ChannelSearch from "./ChannelSearch"
import type {
  Facets,
  FacetKey,
  BooleanFacets,
} from "@mitodl/course-search-utils"
import { ChannelTypeEnum } from "api/v0"
import { Typography } from "ol-components"

type RouteParams = {
  channelType: ChannelTypeEnum
  name: string
}

const ChannelPage: React.FC = () => {
  const { channelType, name } = useParams<RouteParams>()
  const channelQuery = useChannelDetail(String(channelType), String(name))
  const searchParams: Facets & BooleanFacets = {}
  const publicDescription = channelQuery.data?.public_description

  if (channelQuery.data?.search_filter) {
    const urlParams = new URLSearchParams(channelQuery.data.search_filter)
    for (const [key, value] of urlParams.entries()) {
      const paramEntry = searchParams[key as FacetKey]
      if (paramEntry !== undefined) {
        paramEntry.push(value)
      } else {
        searchParams[key as FacetKey] = [value]
      }
    }
  }

  return (
    name &&
    channelType && (
      <>
        <LearningResourceDrawer />
        <ChannelPageTemplate name={name} channelType={channelType}>
          {publicDescription && (
            <Typography variant="body1">{publicDescription}</Typography>
          )}
          {channelQuery.data?.search_filter && (
            <ChannelSearch
              channelTitle={channelQuery.data.title}
              constantSearchParams={searchParams}
              channelType={channelType}
            />
          )}
        </ChannelPageTemplate>
      </>
    )
  )
}

export default ChannelPage
