import { useQuery } from "@tanstack/react-query"
import type {
  TopicsApiTopicsListRequest,
  LearningResourceTopic,
} from "../../generated/v1/api"
import topics from "./keyFactory"

const useTopicsList = (params?: TopicsApiTopicsListRequest) => {
  return useQuery({
    ...topics.list(params),
  })
}

export { useTopicsList }
export type { LearningResourceTopic }
