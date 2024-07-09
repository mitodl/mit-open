import React from "react"
import { useParams } from "react-router"
import ChannelPageSkeleton from "./ChannelPageSkeleton"
import { useChannelDetail } from "api/hooks/channels"
import FieldSearch from "./ChannelSearch"
import {
  type Facets,
  type FacetKey,
  type BooleanFacets,
} from "@mitodl/course-search-utils"
import { ChannelTypeEnum } from "api/v0"
import TestimonialDisplay from "@/page-components/TestimonialDisplay/TestimonialDisplay"
import { styled } from "ol-components"
import {
  DEPARTMENTS as DEPARTMENTS_URL,
  TOPICS as TOPICS_URL,
  UNITS as UNITS_URL,
} from "@/common/urls"

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
    channelType && (
      <ChannelPageSkeleton name={name} channelType={channelType}>
        <p>{channelQuery.data?.public_description}</p>
        {channelType === "unit" ? (
          <StyledTestimonialDisplay offerors={[name]} />
        ) : null}
        {channelQuery.data?.search_filter && (
          <FieldSearch
            constantSearchParams={searchParams}
            channelType={channelType}
          />
        )}
      </ChannelPageSkeleton>
    )
  )
}

export {
  ChannelPage,
  TOPICS_LABEL,
  DEPARTMENTS_LABEL,
  UNITS_LABEL,
  PATHWAYS_LABEL,
  CHANNEL_TYPE_BREADCRUMB_TARGETS,
}
