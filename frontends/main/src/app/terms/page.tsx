import React from "react"
import { Metadata } from "next"

import TermsPage from "@/app-pages/TermsPage/TermsPage"
import { getMetadataAsync } from "@/common/metadata"
export const metadata: Metadata = getMetadataAsync({
  title: "Terms of Service",
})

const Page: React.FC = () => {
  return <TermsPage />
}

export default Page
