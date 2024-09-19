import React from "react"
import { Metadata } from "next"

import { AboutPage } from "@/app-pages/AboutPage/AboutPage"
import { getMetadataAsync } from "@/common/metadata"

export const metadata: Metadata = getMetadataAsync({
  title: "About Us",
})

const Page: React.FC = () => {
  return <AboutPage />
}

export default Page
