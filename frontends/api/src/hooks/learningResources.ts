import {
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query"
import { learningResourcesApi, learningpathsApi, topicsApi } from "../clients"
import type {
  LearningResourcesApiLearningResourcesListRequest,
  LearningResourcesApiLearningResourcesRetrieveRequest,
  LearningpathsApiLearningpathsCreateRequest,
  LearningpathsApiLearningpathsPartialUpdateRequest,
  LearningpathsApiLearningpathsDestroyRequest,
  TopicsApiTopicsListRequest
} from "../generated"
import { createQueryKeys } from "@lukemorales/query-key-factory"

const learningResources = createQueryKeys("learningResources", {
  detail: (params: LearningResourcesApiLearningResourcesRetrieveRequest) => ({
    queryKey: [params],
    queryFn:  () =>
      learningResourcesApi
        .learningResourcesRetrieve(params)
        .then(res => res.data)
  }),
  list: (params: LearningResourcesApiLearningResourcesListRequest) => ({
    queryKey: [params],
    queryFn:  () =>
      learningResourcesApi.learningResourcesList(params).then(res => res.data)
  }),
  topics: (params: TopicsApiTopicsListRequest) => ({
    queryKey: [params],
    queryFn:  () => topicsApi.topicsList(params).then(res => res.data)
  })
})
const useLearningResourcesList = (
  params: LearningResourcesApiLearningResourcesListRequest = {}
) => {
  return useQuery(learningResources.list(params))
}

const useLearningResourcesDetail = (
  params: LearningResourcesApiLearningResourcesRetrieveRequest
) => {
  return useQuery(learningResources.detail(params))
}

const useLearningResourceTopics = (
  params: TopicsApiTopicsListRequest = {},
  opts: Pick<UseQueryOptions, "enabled"> = {}
) => {
  return useQuery({
    ...learningResources.topics(params),
    ...opts
  })
}

type LearningPathCreateRequest = {
  learningPathResourceRequest: Omit<
    LearningpathsApiLearningpathsCreateRequest["learningPathResourceRequest"],
    "readable_id" | "resource_type"
  >
}
const useLearningpathCreate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: LearningPathCreateRequest) =>
      learningpathsApi.learningpathsCreate(
        // @ts-expect-error 'readable_id' and 'resource_type' are erroneously required
        params
      ),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: learningResources._def // TODO much too agressive
      })
  })
}
const useLearningpathUpdate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: LearningpathsApiLearningpathsPartialUpdateRequest) =>
      learningpathsApi.learningpathsPartialUpdate(params),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: learningResources._def // TODO much too agressive
      })
  })
}

const useLearningpathDestroy = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: LearningpathsApiLearningpathsDestroyRequest) =>
      learningpathsApi.learningpathsDestroy(params),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: learningResources._def // TODO much too agressive
      })
  })
}

export {
  useLearningResourcesList,
  useLearningResourcesDetail,
  useLearningResourceTopics,
  useLearningpathCreate,
  useLearningpathUpdate,
  useLearningpathDestroy
}
