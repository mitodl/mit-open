import {
  UseQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query"
import { learningResourcesApi, learningpathsApi, topicsApi } from "../clients"
import type {
  LearningResourcesApiLearningResourcesListRequest,
  LearningpathsApiLearningpathsCreateRequest,
  LearningpathsApiLearningpathsPartialUpdateRequest,
  LearningpathsApiLearningpathsDestroyRequest,
  TopicsApiTopicsListRequest,
  LearningpathsApiLearningpathsResourcesListRequest
} from "../generated"
import { createQueryKeys } from "@lukemorales/query-key-factory"

const learningResources = createQueryKeys("learningResources", {
  detail: (id: number) => ({
    queryKey: [id],
    queryFn:  () =>
      learningResourcesApi
        .learningResourcesRetrieve({ id })
        .then(res => res.data),
    contextQueries: {
      items: (
        itemsP: LearningpathsApiLearningpathsResourcesListRequest,
        infinite: boolean
      ) => ({
        queryKey: [{ ...itemsP, infinite }],
        queryFn:  () =>
          learningpathsApi
            .learningpathsResourcesList(itemsP)
            .then(res => res.data)
      })
    }
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

const useLearningResourcesDetail = (id: number) => {
  return useQuery(learningResources.detail(id))
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

const useInfiniteLearningPathItems = (
  params: LearningpathsApiLearningpathsResourcesListRequest,
  options: Pick<UseQueryOptions, "enabled"> = {}
) => {
  return useInfiniteQuery({
    ...learningResources.detail(params.parent_id)._ctx.items(params, true),
    getNextPageParam: lastPage => lastPage.next ?? undefined,
    ...options
  })
}

type LearningPathCreateRequest = Omit<
  LearningpathsApiLearningpathsCreateRequest["LearningPathResourceRequest"],
  "readable_id" | "resource_type"
>
const useLearningpathCreate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: LearningPathCreateRequest) =>
      learningpathsApi.learningpathsCreate({
        // @ts-expect-error 'readable_id' and 'resource_type' are erroneously required
        LearningPathResourceRequest: params
      }),
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

interface LearningpathMoveRequest {
  parentId: number
  id: number
  position?: number
}
const useLearningpathMove = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ parentId, id, position }: LearningpathMoveRequest) =>
      learningpathsApi.learningpathsResourcesPartialUpdate({
        parent_id:                              parentId,
        id,
        PatchedLearningPathRelationshipRequest: { position }
      }),
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
  useInfiniteLearningPathItems,
  useLearningpathCreate,
  useLearningpathUpdate,
  useLearningpathDestroy,
  useLearningpathMove
}
