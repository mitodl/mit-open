import React from "react"
import { Metadata } from "next"
import { getMetadata } from "@/common/metadata"
import PageWrapper from "./ClientWrapper"

export const metadata: Metadata = getMetadata({
  title: "Onboarding",
  social: false,
})

const Page: React.FC = () => {
  return <PageWrapper />
}

export default Page
