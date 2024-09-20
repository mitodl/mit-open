import React from "react"
import { Metadata } from "next"

import UnitsListingPage from "@/app-pages/UnitsListingPage/UnitsListingPage"
import { standardizeMetadata } from "@/common/metadata"
export const metadata: Metadata = standardizeMetadata({
  title: "Units",
})

const Page: React.FC = () => {
  return <UnitsListingPage />
}

export default Page
