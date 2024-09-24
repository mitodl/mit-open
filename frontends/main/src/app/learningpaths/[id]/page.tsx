import React from "react"
import LearningPathDetailsPage from "@/app-pages/LearningPathDetailsPage/LearningPathDetailsPage"
import RestrictedRoute from "@/components/RestrictedRoute/RestrictedRoute"
import { Permissions } from "@/common/permissions"

const Page: React.FC = () => {
  return (
    <RestrictedRoute requires={Permissions.LearningPathEditor}>
      <LearningPathDetailsPage />
    </RestrictedRoute>
  )
}

export default Page
