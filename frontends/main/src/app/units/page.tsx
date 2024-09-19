import React from "react"
import { Metadata } from "next"

import UnitsListingPage from "@/app-pages/UnitsListingPage/UnitsListingPage"
import { getMetadataAsync } from "@/common/metadata"
export const metadata: Metadata = getMetadataAsync({
  title: "Units",
})

const Page: React.FC = () => {
  return <UnitsListingPage />
}

export default Page
