import {
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { channelsApi } from "../../clients"
import type {
  ChannelsApiChannelsListRequest,
  PatchedChannelWriteRequest,
} from "../../generated/v0"
import channels from "./keyFactory"

const useChannelsList = (
  params: ChannelsApiChannelsListRequest = {},
  opts: Pick<UseQueryOptions, "enabled"> = {},
) => {
  return useQuery({
    ...channels.list(params),
    ...opts,
  })
}

const useChannelDetail = (channelType: string, channelName: string) => {
  return useQuery({
    ...channels.detailByType(channelType, channelName),
  })
}
const useChannelCounts = (channelType: string) => {
  return useQuery({
    ...channels.countsByType(channelType),
  })
}

const useChannelPartialUpdate = () => {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (data: PatchedChannelWriteRequest & { id: number }) =>
      channelsApi
        .channelsPartialUpdate({
          id: data.id,
          PatchedChannelWriteRequest: data,
        })
        .then((response) => response.data),
    onSuccess: (_data) => {
      client.invalidateQueries(channels._def)
    },
  })
}

export {
  useChannelDetail,
  useChannelsList,
  useChannelPartialUpdate,
  useChannelCounts,
}
