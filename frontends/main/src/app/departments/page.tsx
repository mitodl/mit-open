import React from "react"
import { Metadata } from "next"

import { getMetadataAsync } from "@/common/metadata"
export const metadata: Metadata = getMetadataAsync({
  title: "Departments",
})

import DepartmentListingPage from "@/app-pages/DepartmentListingPage/DepartmentListingPage"

const Page: React.FC = () => {
  return <DepartmentListingPage />
}

export default Page
