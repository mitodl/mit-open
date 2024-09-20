import React from "react"
import { Metadata } from "next"

import PrivacyPage from "@/app-pages/PrivacyPage/PrivacyPage"
import { standardizeMetadata } from "@/common/metadata"
export const metadata: Metadata = standardizeMetadata({
  title: "Privacy Policy",
})

const Page: React.FC = () => {
  return <PrivacyPage />
}

export default Page
