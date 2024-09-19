import React from "react"
import { Metadata } from "next"

import PrivacyPage from "@/app-pages/PrivacyPage/PrivacyPage"
import { getMetadataAsync } from "@/common/metadata"
export const metadata: Metadata = getMetadataAsync({
  title: "Privacy Policy",
})

const Page: React.FC = () => {
  return <PrivacyPage />
}

export default Page
