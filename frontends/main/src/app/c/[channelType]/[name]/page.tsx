import React from "react"
import ChannelPage from "@/app-pages/ChannelPage/ChannelPage"
import { channelsApi } from "api/clients"
import { ChannelTypeEnum } from "api/v0"
import { getMetadataAsync } from "@/common/metadata"
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME

type RouteParams = {
  channelType: ChannelTypeEnum
  name: string
}

export async function generateMetadata({
  searchParams,
  params,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
  params: RouteParams
}) {
  const { channelType, name } = params

  const channelDetails = await channelsApi
    .channelsTypeRetrieve({ channel_type: channelType, name: name })
    .then((res) => res.data)
  if (searchParams?.resource) {
    return await getMetadataAsync({
      title: "Learn with MIT",
      searchParams,
    })
  }
  return {
    title: `${channelDetails.title} | ${SITE_NAME}`,
    description: channelDetails.public_description,
    openGraph: {
      images: channelDetails.configuration.logo,
      url: channelDetails.channel_url,
      siteName: SITE_NAME,
    },
  }
}

const Page: React.FC = () => {
  return <ChannelPage />
}

export default Page
