import React, { Suspense } from "react"
import { Metadata } from "next"
import { getMetadata } from "@/common/metadata"
import SearchPage from "@/app-pages/SearchPage/SearchPage"

export const metadata: Metadata = getMetadata({
  title: "Search",
})

const Page: React.FC = () => {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  )
}

export default Page
