import React, { Suspense } from "react"
import { getMetadataAsync } from "@/common/metadata"
import SearchPage from "@/app-pages/SearchPage/SearchPage"
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  if (searchParams?.resource) {
    return await getMetadataAsync({
      title: "Learn with MIT",
      searchParams,
    })
  }
  return await getMetadataAsync({
    title: `Search | ${SITE_NAME}`,
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
