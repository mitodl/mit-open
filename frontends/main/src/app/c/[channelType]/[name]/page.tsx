import React from "react"
import ChannelPage from "@/app-pages/ChannelPage/ChannelPage"
import { channelsApi } from "api/clients"

import { GetStaticPropsContext } from "next"

export async function generateMetadata({ params }: GetStaticPropsContext) {
  const { channelType, name } = params
  const channelDetails = await channelsApi
    .channelsTypeRetrieve({ channel_type: channelType, name: name })
    .then((res) => res.data)
  return {
    title: `${channelDetails.title} | MIT Learn`,
    description: channelDetails.public_description,
    openGraph: {
      images: channelDetails.configuration.logo,
      url: channelDetails.channel_url,
    },
  }
}

const Page: React.FC = () => {
  return <ChannelPage />
}

export default Page
