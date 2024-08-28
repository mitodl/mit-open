import React from "react"
import type { Metadata } from 'next'
import { dehydrate, Hydrate } from "api/ssr"
import HomePage from "@/app-pages/HomePage/HomePage"
import * as carousels from "@/app-pages/HomePage/carousels"
import { learningResourcesKeyFactory } from "api/hooks/learningResources"
import { FeaturedApiFeaturedListRequest } from "api/generated/v1/api"
import getQueryClient from "./getQueryClient"
import { getMetadata } from "@/common/metadata"

export const metadata: Metadata = getMetadata({
  title: "Learn with MIT"
})

const Page: React.FC = async () => {
  const queryClient = getQueryClient()

  /*
   * Prefetch the first tab (All) of the carousel
   */
  await queryClient.prefetchQuery(
    learningResourcesKeyFactory.featured(
      carousels.FEATURED_RESOURCES_CAROUSEL[0].data
        .params as FeaturedApiFeaturedListRequest,
    ),
  )

  const dehydratedState = dehydrate(queryClient)

  return (
    <Hydrate state={JSON.parse(JSON.stringify(dehydratedState))}>
      <HomePage />
    </Hydrate>
  )
}

export default Page
