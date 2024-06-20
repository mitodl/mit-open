import React from "react"
import { useParams } from "react-router"
import FieldPageSkeleton from "./FieldPageSkeleton"
import { useChannelDetail } from "api/hooks/fields"
import FieldSearch from "./FieldSearch"
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

const FieldPage: React.FC = () => {
  const { channelType, name } = useParams<RouteParams>()
  const fieldQuery = useChannelDetail(String(channelType), String(name))
  const searchParams: Facets & BooleanFacets = {}

  if (fieldQuery.data?.search_filter) {
    const urlParams = new URLSearchParams(fieldQuery.data.search_filter)
    for (const [key, value] of urlParams.entries()) {
      searchParams[key as FacetKey] = value.split(",")
    }
  }

  return (
    name &&
    channelType && (
      <FieldPageSkeleton name={name} channelType={channelType}>
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
      </FieldPageSkeleton>
    )
  )
}

export default FieldPage
