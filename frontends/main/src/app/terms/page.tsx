import React from "react"
import { Metadata } from "next"
import { getMetadata } from "@/common/metadata"
import TermsPage from "@/app-pages/TermsPage/TermsPage"

export const metadata: Metadata = getMetadata({
  title: "Terms of Service",
})

const Page: React.FC = () => {
  return <TermsPage />
}

export default Page
