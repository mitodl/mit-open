import React from "react"
import LearningPathListingPage from "@/app-pages/LearningPathListingPage/LearningPathListingPage"
import { getMetadata } from "@/common/metadata"
import { Metadata } from "next"

export const metadata: Metadata = getMetadata({
  title: "Learning Paths",
})

const Page: React.FC = () => {
  return <LearningPathListingPage />
}

export default Page
