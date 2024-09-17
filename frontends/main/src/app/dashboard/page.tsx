import React from "react"
import { Metadata } from "next"
import { getMetadata } from "@/common/metadata"
import DashboardPage from "@/app-pages/DashboardPage/DashboardPage"

export const metadata: Metadata = getMetadata({
  title: "Your MIT Learning Journey | MIT Learn",
  social: false,
})

const Page: React.FC = () => {
  return <DashboardPage />
}

export default Page
