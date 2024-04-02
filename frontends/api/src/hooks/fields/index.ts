import {
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { channelsApi } from "../../clients"
import type {
  ChannelsApiChannelsListRequest as ChannelsApiListRequest,
  PatchedFieldChannelWriteRequest,
} from "../../generated/v0"
import channels from "./keyFactory"

const useChannelsList = (
  params: ChannelsApiListRequest = {},
  opts: Pick<UseQueryOptions, "enabled"> = {},
) => {
  return useQuery({
    ...channels.list(params),
    ...opts,
  })
}

const useChannelDetail = (id: number) => {
  return useQuery({
    ...channels.detail(id),
  })
}

const useChannelDetailByType = (channelType: string, fieldName: string) => {
  return useQuery({
    ...channels.detailByType(channelType, fieldName),
  })
}

const useChannelPartialUpdate = () => {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (data: PatchedFieldChannelWriteRequest & { id: number }) =>
      channelsApi
        .channelsPartialUpdate({
          id: data.id,
          PatchedFieldChannelWriteRequest: data,
        })
        .then((response) => response.data),
    onSuccess: (_data) => {
      client.invalidateQueries(channels._def)
    },
  })
}

export {
  useChannelDetail,
  useChannelDetailByType,
  useChannelsList,
  useChannelPartialUpdate,
}
