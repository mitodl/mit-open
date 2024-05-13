import { topicsApi } from "../../clients"
import type { TopicsApiTopicsListRequest } from "../../generated/v1"
import { createQueryKeys } from "@lukemorales/query-key-factory"

const topics = createQueryKeys("topics", {
  list: (params?: TopicsApiTopicsListRequest) => ({
    queryKey: [params],
    queryFn: () => topicsApi.topicsList(params).then((res) => res.data),
  }),
})

export default topics
