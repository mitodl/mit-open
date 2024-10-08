import React from "react"
import DashboardPage from "@/app-pages/DashboardPage/DashboardPage"

import { Metadata } from "next"
import { standardizeMetadata } from "@/common/metadata"
import RestrictedRoute from "@/components/RestrictedRoute/RestrictedRoute"
import { Permissions } from "@/common/permissions"

export const metadata: Metadata = standardizeMetadata({
  title: "Your MIT Learning Journey",
  social: false,
})

const Page: React.FC = () => {
  return (
    <RestrictedRoute requires={Permissions.Authenticated}>
      <DashboardPage />
    </RestrictedRoute>
  )
}

export default Page
