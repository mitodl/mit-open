import React, { Suspense } from "react"
import { getMetadataAsync } from "@/common/metadata"
import SearchPage from "@/app-pages/SearchPage/SearchPage"

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return await getMetadataAsync({
    title: "Search",
    searchParams,
  })
}

const Page: React.FC = () => {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  )
}

export default Page
