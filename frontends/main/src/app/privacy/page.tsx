import React from "react"
import { Metadata } from "next"
import { getMetadata } from "@/common/metadata"
import PrivacyPage from "@/app-pages/PrivacyPage/PrivacyPage"

export const metadata: Metadata = getMetadata({
  title: "Privacy Policy",
})

const Page: React.FC = () => {
  return <PrivacyPage />
}

export default Page
