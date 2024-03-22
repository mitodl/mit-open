import type { QueryClient, Query } from "@tanstack/react-query"
import {
  learningResourcesApi,
  learningpathsApi,
  learningResourcesSearchApi,
  topicsApi,
} from "../../clients"
import axiosInstance from "../../axios"
import type {
  LearningResourcesApiLearningResourcesListRequest as LRListRequest,
  TopicsApiTopicsListRequest as TopicsListRequest,
  LearningpathsApiLearningpathsItemsListRequest as LPResourcesListRequest,
  LearningpathsApiLearningpathsListRequest as LPListRequest,
  PaginatedLearningResourceList,
  LearningResource,
  PaginatedLearningPathRelationshipList,
  LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest as LRSearchRequest,
} from "../../generated/v1"
import { createQueryKeys } from "@lukemorales/query-key-factory"

const learningResources = createQueryKeys("learningResources", {
  detail: (id: number) => ({
    queryKey: [id],
    meow: "meow",
    queryFn: () =>
      learningResourcesApi
        .learningResourcesRetrieve({ id })
        .then((res) => res.data),
  }),
  list: (params: LRListRequest) => ({
    queryKey: [params],
    queryFn: () =>
      learningResourcesApi
        .learningResourcesList(params)
        .then((res) => res.data),
  }),
  topics: (params: TopicsListRequest) => ({
    queryKey: [params],
    queryFn: () => topicsApi.topicsList(params).then((res) => res.data),
  }),
  learningpaths: {
    queryKey: ["learning_paths"],
    contextQueries: {
      detail: (id: number) => ({
        queryKey: [id],
        queryFn: () =>
          learningpathsApi
            .learningpathsRetrieve({ id })
            .then((res) => res.data),
        contextQueries: {
          infiniteItems: (itemsP: LPResourcesListRequest) => ({
            queryKey: [itemsP],
            queryFn: ({ pageParam }: { pageParam?: string } = {}) => {
              // Use generated API for first request, then use next parameter
              const request = pageParam
                ? axiosInstance.request<PaginatedLearningPathRelationshipList>({
                    method: "get",
                    url: pageParam,
                  })
                : learningpathsApi.learningpathsItemsList(itemsP)
              return request.then((res) => res.data)
            },
          }),
        },
      }),
      list: (params: LPListRequest) => ({
        queryKey: [params],
        queryFn: () =>
          learningpathsApi.learningpathsList(params).then((res) => res.data),
      }),
    },
  },
  search: (params: LRSearchRequest) => {
    return {
      queryKey: [params],
      queryFn: () =>
        learningResourcesSearchApi
          .learningResourcesSearchRetrieve(params)
          .then((res) => res.data),
    }
  },
})

const listHasResource =
  (resourceId: number) =>
  (query: Query): boolean => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = query.state.data as any
    const resources: LearningResource[] = data.pages
      ? data.pages.flatMap(
          (page: PaginatedLearningResourceList) => page.results,
        )
      : data.results
    return resources.some((res) => res.id === resourceId)
  }
const invalidateResourceQueries = (
  queryClient: QueryClient,
  resourceId: LearningResource["id"],
) => {
  /**
   * Invalidate details queries.
   * In this case, looking up queries by key is easy.
   */
  queryClient.invalidateQueries(learningResources.detail(resourceId).queryKey)
  queryClient.invalidateQueries(
    learningResources.learningpaths._ctx.detail(resourceId).queryKey,
  )
  /**
   * Invalidate lists that the resource belongs to.
   * Check for actual membership.
   */
  const lists = [
    learningResources.list._def,
    learningResources.learningpaths._ctx.list._def,
  ]
  lists.forEach((queryKey) => {
    queryClient.invalidateQueries({
      queryKey,
      predicate: listHasResource(resourceId),
    })
  })
}

export default learningResources
export { invalidateResourceQueries }
