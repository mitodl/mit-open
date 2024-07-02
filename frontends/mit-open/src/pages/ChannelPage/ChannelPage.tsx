import React from "react"
import { useParams } from "react-router"
import ChannelPageSkeleton from "./ChannelPageSkeleton"
import { useChannelDetail } from "api/hooks/channels"
import FieldSearch from "./ChannelSearch"
import type {
  Facets,
  FacetKey,
  BooleanFacets,
} from "@mitodl/course-search-utils"
import { ChannelTypeEnum } from "api/v0"
import TestimonialDisplay from "@/page-components/TestimonialDisplay/TestimonialDisplay"
import { styled } from "ol-components"
import DefaultChannelSkeleton from "./DefaultChannelSkeleton"

export const StyledTestimonialDisplay = styled(TestimonialDisplay)`
  margin-bottom: 80px;
`

type RouteParams = {
  channelType: ChannelTypeEnum
  name: string
}

const ChannelPage: React.FC = () => {
  const { channelType, name } = useParams<RouteParams>()
  const channelQuery = useChannelDetail(String(channelType), String(name))
  const searchParams: Facets & BooleanFacets = {}

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
    channelType &&
    (channelType === "unit" ? (
      <ChannelPageSkeleton name={name} channelType={channelType}>
        <p>{channelQuery.data?.public_description}</p>
        <StyledTestimonialDisplay offerors={[name]} />
        {channelQuery.data?.search_filter && (
          <FieldSearch
            constantSearchParams={searchParams}
            channelType={channelType}
          />
        )}
      </ChannelPageSkeleton>
    ) : (
      <DefaultChannelSkeleton name={name} channelType={channelType}>
        <p>{channelQuery.data?.public_description}</p>
        {channelQuery.data?.search_filter && (
          <FieldSearch
            constantSearchParams={searchParams}
            channelType={channelType}
          />
        )}
      </DefaultChannelSkeleton>
    ))
  )
}

export default ChannelPage
