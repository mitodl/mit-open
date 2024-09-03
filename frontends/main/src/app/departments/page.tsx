import React from "react"
import { Metadata } from "next"
import { getMetadata } from "@/common/metadata"

export const metadata: Metadata = getMetadata({
  title: "Departments",
})

import DepartmentListingPage from "@/app-pages/DepartmentListingPage/DepartmentListingPage"

const Page: React.FC = () => {
  return <DepartmentListingPage />
}

export default Page
