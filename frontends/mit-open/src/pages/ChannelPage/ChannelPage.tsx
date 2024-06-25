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

export const StyledTestimonialDisplay = styled(TestimonialDisplay)`
  margin-bottom: 80px;
`

type RouteParams = {
  channelType: ChannelTypeEnum
  name: string
}

const ChannelPage: React.FC = () => {
  const { channelType, name } = useParams<RouteParams>()
  const fieldQuery = useChannelDetail(String(channelType), String(name))
  const searchParams: Facets & BooleanFacets = {}

  if (fieldQuery.data?.search_filter) {
    const urlParams = new URLSearchParams(fieldQuery.data.search_filter)
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
      <ChannelPageSkeleton name={name} channelType={channelType}>
        <p>{fieldQuery.data?.public_description}</p>
        {channelType === "unit" ? (
          <StyledTestimonialDisplay offerors={[name]} />
        ) : null}
        {fieldQuery.data?.search_filter && (
          <FieldSearch
            constantSearchParams={searchParams}
            channelType={channelType}
          />
        )}
      </ChannelPageSkeleton>
    )
  )
}

export default ChannelPage
