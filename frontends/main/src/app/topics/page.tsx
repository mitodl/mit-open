import React from "react"
import { Metadata } from "next"

import { standardizeMetadata } from "@/common/metadata"
export const metadata: Metadata = standardizeMetadata({
  title: "Topics",
})

import TopicsListingPage from "@/app-pages/TopicsListingPage/TopicsListingPage"

const Page: React.FC = () => {
  return <TopicsListingPage />
}

export default Page
