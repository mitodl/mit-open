import React from "react"
import LearningPathListingPage from "@/app-pages/LearningPathListingPage/LearningPathListingPage"

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME

export const metadata = {
  title: `Learning Paths | ${SITE_NAME}`,
}

const Page: React.FC = () => {
  return <LearningPathListingPage />
}

export default Page
