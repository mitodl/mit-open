import { channelsApi } from "../../clients"
import type { ChannelsApiChannelsListRequest as FieldsApiListRequest } from "../../generated/v0"
import { createQueryKeys } from "@lukemorales/query-key-factory"

const channels = createQueryKeys("channel", {
  detailByType: (channelType: string, name: string) => ({
    queryKey: [channelType, name],
    queryFn: () => {
      return channelsApi
        .channelsTypeRetrieve({ channel_type: channelType, name: name })
        .then((res) => res.data)
    },
  }),
  countsByType: (channelType: string) => ({
    queryKey: [channelType],
    queryFn: () => {
      return channelsApi
        .channelsCountsList({ channel_type: channelType })
        .then((res) => res.data)
    },
  }),
  detail: (id: number) => ({
    queryKey: [id],
    queryFn: () => {
      return channelsApi.channelsRetrieve({ id: id }).then((res) => res.data)
    },
  }),
  list: (params: FieldsApiListRequest) => ({
    queryKey: [params],
    queryFn: () => channelsApi.channelsList(params).then((res) => res.data),
  }),
})

export default channels
