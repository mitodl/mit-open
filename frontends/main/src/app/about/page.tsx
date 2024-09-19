import React from "react"
import { Metadata } from "next"

import { AboutPage } from "@/app-pages/AboutPage/AboutPage"
import { standardizeMetadata } from "@/common/metadata"

export const metadata: Metadata = standardizeMetadata({
  title: "About Us",
})

const Page: React.FC = () => {
  return <AboutPage />
}

export default Page
