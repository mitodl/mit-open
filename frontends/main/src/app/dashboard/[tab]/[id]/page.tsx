import React from "react"
import DashboardPage from "@/app-pages/DashboardPage/DashboardPage"

import { Metadata } from "next"
import { getMetadataAsync } from "@/common/metadata"

export const metadata: Metadata = getMetadataAsync({
  title: "Your MIT Learning Journey",
  social: false,
})

const Page: React.FC = () => {
  return <DashboardPage />
}

export default Page
