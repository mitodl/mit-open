import React from "react"
import LearningPathListingPage from "@/app-pages/LearningPathListingPage/LearningPathListingPage"
import { getMetadata } from "@/common/metadata"

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME

export const metadata: Metadata = getMetadata({
  title: `Learning Paths | ${SITE_NAME}`,
})

const Page: React.FC = () => {
  return <LearningPathListingPage />
}

export default Page
