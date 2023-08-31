import { useQuery } from "@tanstack/react-query"
import { learningResourcesApi as api } from "../clients"
import type {
  LearningResourcesApiLearningResourcesListRequest,
  LearningResourcesApiLearningResourcesRetrieveRequest,
} from "../generated"
import { createQueryKeys } from "@lukemorales/query-key-factory"

const learningResources = createQueryKeys("learningResources", {
  detail: (params: LearningResourcesApiLearningResourcesRetrieveRequest) => ({
    queryKey: [params],
    queryFn: () =>
      api.learningResourcesRetrieve(params).then((res) => res.data),
  }),
  list: (params: LearningResourcesApiLearningResourcesListRequest) => ({
    queryKey: [params],
    queryFn: () => api.learningResourcesList(params).then((res) => res.data),
  }),
})
const useLearningResourcesList = (
  params: LearningResourcesApiLearningResourcesListRequest = {},
) => {
  return useQuery(learningResources.list(params))
}

const useLearningResourcesDetail = (
  params: LearningResourcesApiLearningResourcesRetrieveRequest,
) => {
  return useQuery(learningResources.detail(params))
}

export { useLearningResourcesList, useLearningResourcesDetail }
