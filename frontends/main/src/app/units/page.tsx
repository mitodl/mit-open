import React from "react"
import { Metadata } from "next"
import { getMetadata } from "@/common/metadata"
import UnitsListingPage from "@/app-pages/UnitsListingPage/UnitsListingPage"
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME
export const metadata: Metadata = getMetadata({
  title: `Units | ${SITE_NAME}`,
})

const Page: React.FC = () => {
  return <UnitsListingPage />
}

export default Page
