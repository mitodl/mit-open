import React from "react"
import { Metadata } from "next"
import { getMetadata } from "@/common/metadata"

export const metadata: Metadata = getMetadata({
  title: "Topics",
})

import TopicsListingPage from "@/app-pages/TopicsListingPage/TopicsListingPage"

const Page: React.FC = () => {
  return <TopicsListingPage />
}

export default Page
