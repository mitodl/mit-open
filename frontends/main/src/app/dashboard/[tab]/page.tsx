import React from "react"
import DashboardPage from "@/app-pages/DashboardPage/DashboardPage"
import { getMetadata } from "@/common/metadata"

export const metadata: Metadata = getMetadata({
  title: "Your MIT Learning Journey | MIT Learn",
  social: false,
})
const Page: React.FC = () => {
  return <DashboardPage />
}

export default Page
