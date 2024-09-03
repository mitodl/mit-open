import React from "react"
import { Metadata } from "next"
import { getMetadata } from "@/common/metadata"
import { AboutPage } from "@/app-pages/AboutPage/AboutPage"

export const metadata: Metadata = getMetadata({
  title: "About Us"
})

const Page: React.FC = () => {
  return <AboutPage />
}

export default Page
