import React from "react"
import type { Metadata } from "next"
import HomePage from "@/app-pages/HomePage/HomePage"
import { getMetadataAsync } from "@/common/metadata"

const { NEXT_PUBLIC_ORIGIN } = process.env

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}): Promise<Metadata> {
  return await getMetadataAsync({
    metadataBase: NEXT_PUBLIC_ORIGIN ? new URL(NEXT_PUBLIC_ORIGIN) : null,
    title: "Learn with MIT",
    searchParams,
  })
}

const Page: React.FC = async () => {
  return <HomePage />
}

export default Page
