import React from "react"
import ChannelPage from "@/app-pages/ChannelPage/ChannelPage"
import { channelsApi } from "api/clients"
import { ChannelTypeEnum } from "api/v0"
import { getMetadataAsync } from "@/common/metadata"

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
  return getMetadataAsync({
    searchParams,
    title: `${channelDetails.title}`,
    description: channelDetails.public_description,
  })
}

const Page: React.FC = () => {
  return <ChannelPage />
}

export default Page
