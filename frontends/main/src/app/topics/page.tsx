import React from "react"
import { Metadata } from "next"

import { getMetadataAsync } from "@/common/metadata"
export const metadata: Metadata = getMetadataAsync({
  title: "Topics",
})

import TopicsListingPage from "@/app-pages/TopicsListingPage/TopicsListingPage"

const Page: React.FC = () => {
  return <TopicsListingPage />
}

export default Page
