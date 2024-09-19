import React from "react"
import LearningPathListingPage from "@/app-pages/LearningPathListingPage/LearningPathListingPage"

import { Metadata } from "next"
import { getMetadataAsync } from "@/common/metadata"
export const metadata: Metadata = getMetadataAsync({
  title: "Learning Paths",
})

const Page: React.FC = () => {
  return <LearningPathListingPage />
}

export default Page
