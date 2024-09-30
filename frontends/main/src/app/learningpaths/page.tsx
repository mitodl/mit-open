import React from "react"
import LearningPathListingPage from "@/app-pages/LearningPathListingPage/LearningPathListingPage"

import { Metadata } from "next"
import { standardizeMetadata } from "@/common/metadata"
import RestrictedRoute from "@/components/RestrictedRoute/RestrictedRoute"
import { Permissions } from "@/common/permissions"

export const metadata: Metadata = standardizeMetadata({
  title: "Learning Paths",
})

const Page: React.FC = () => {
  return (
    <RestrictedRoute requires={Permissions.LearningPathEditor}>
      <LearningPathListingPage />
    </RestrictedRoute>
  )
}

export default Page
