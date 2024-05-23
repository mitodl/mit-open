import { newsEventsApi } from "../../clients"
import type { NewsEventsApiNewsEventsListRequest } from "../../generated/v0"
import { createQueryKeys } from "@lukemorales/query-key-factory"

const newsEvents = createQueryKeys("newsEvents", {
  list: (params: NewsEventsApiNewsEventsListRequest) => ({
    queryKey: [params],
    queryFn: () => newsEventsApi.newsEventsList(params).then((res) => res.data),
  }),
  detail: (id: number) => ({
    queryKey: [id],
    queryFn: () => {
      return newsEventsApi
        .newsEventsRetrieve({ id: id })
        .then((res) => res.data)
    },
  }),
})

export default newsEvents
