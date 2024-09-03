import React from "react"
import { Metadata } from "next"
import { getMetadata } from "@/common/metadata"
import UnitsListingPage from "@/app-pages/UnitsListingPage/UnitsListingPage"

export const metadata: Metadata = getMetadata({
  title: "Units",
})

const Page: React.FC = () => {
  return <UnitsListingPage />
}

export default Page
