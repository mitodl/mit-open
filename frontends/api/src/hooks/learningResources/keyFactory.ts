import type { QueryClient, Query } from "@tanstack/react-query"
import {
  learningResourcesApi,
  learningpathsApi,
  learningResourcesSearchApi,
  topicsApi,
  userListsApi,
  offerorsApi,
  platformsApi,
  schoolsApi,
  featuredApi,
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
  UserlistsApiUserlistsItemsListRequest as ULResourcesListRequest,
  UserlistsApiUserlistsListRequest as ULListRequest,
  PaginatedUserListRelationshipList,
  UserList,
  OfferorsApiOfferorsListRequest,
  PlatformsApiPlatformsListRequest,
  FeaturedApiFeaturedListRequest as FeaturedListParams,
  UserListRelationship,
  MicroUserListRelationship,
} from "../../generated/v1"

import { createQueryKeys } from "@lukemorales/query-key-factory"

const shuffle = ([...arr]) => {
  let m = arr.length
  while (m) {
    const i = Math.floor(Math.random() * m--)
    ;[arr[m], arr[i]] = [arr[i], arr[m]]
  }
  return arr
}

const randomizeResults = ([...results]) => {
  const resultsByPosition: {
    [position: string]: (LearningResource & { position?: string })[] | undefined
  } = {}
  const randomizedResults: LearningResource[] = []
  results.forEach((result) => {
    if (!resultsByPosition[result?.position]) {
      resultsByPosition[result?.position] = []
    }
    resultsByPosition[result?.position ?? ""]?.push(result)
  })
  Object.keys(resultsByPosition)
    .sort()
    .forEach((position) => {
      const shuffled = shuffle(resultsByPosition[position] ?? [])
      randomizedResults.push(...shuffled)
    })
  return randomizedResults
}

const learningResources = createQueryKeys("learningResources", {
  detail: (id: number) => ({
    queryKey: [id],
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
  featured: (params: FeaturedListParams = {}) => ({
    queryKey: [params],
    queryFn: () => {
      return featuredApi.featuredList(params).then((res) => {
        res.data.results = randomizeResults(res.data?.results)
        return res.data
      })
    },
  }),
  topic: (id: number | undefined) => ({
    queryKey: [id],
    queryFn: () =>
      id ? topicsApi.topicsRetrieve({ id }).then((res) => res.data) : null,
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
  userlists: {
    queryKey: ["user_lists"],
    contextQueries: {
      detail: (id: number) => ({
        queryKey: [id],
        queryFn: () =>
          userListsApi.userlistsRetrieve({ id }).then((res) => res.data),
        contextQueries: {
          infiniteItems: (itemsP: ULResourcesListRequest) => ({
            queryKey: [itemsP],
            queryFn: ({ pageParam }: { pageParam?: string } = {}) => {
              const request = pageParam
                ? axiosInstance.request<PaginatedUserListRelationshipList>({
                    method: "get",
                    url: pageParam,
                  })
                : userListsApi.userlistsItemsList(itemsP)
              return request.then((res) => res.data)
            },
          }),
        },
      }),
      list: (params: ULListRequest) => ({
        queryKey: [params],
        queryFn: () =>
          userListsApi.userlistsList(params).then((res) => res.data),
      }),
    },
  },
  offerors: (params: OfferorsApiOfferorsListRequest) => {
    return {
      queryKey: [params],
      queryFn: () => offerorsApi.offerorsList(params).then((res) => res.data),
    }
  },
  platforms: (params: PlatformsApiPlatformsListRequest) => {
    return {
      queryKey: [params],
      queryFn: () => platformsApi.platformsList(params).then((res) => res.data),
    }
  },
  schools: () => {
    return {
      queryKey: ["schools"],
      queryFn: () => schoolsApi.schoolsList().then((res) => res.data),
    }
  },
})

const listHasResource =
  (resourceId: number) =>
  (query: Query): boolean => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = query.state.data as any
    const resources: LearningResource[] | UserList[] = data.pages
      ? data.pages.flatMap(
          (page: PaginatedLearningResourceList) => page.results,
        )
      : data.results

    return resources.some((res) => res.id === resourceId)
  }

const resourcesHaveUserList =
  (userListId: number) =>
  (query: Query): boolean => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = query.state.data as any
    const resources: LearningResource[] = data.pages
      ? data.pages.flatMap(
          (page: PaginatedLearningResourceList) => page.results,
        )
      : data.results

    return resources?.some((res) =>
      res.user_list_parents?.some((userList) => userList.parent === userListId),
    )
  }

const resourceHasUserList =
  (userListId: number) =>
  (query: Query): boolean => {
    const data = query.state.data as LearningResource
    return !!data.user_list_parents?.some(
      (userList) => userList.parent === userListId,
    )
  }

/**
 * Invalidate Resource queries that a specific resource appears in.
 *
 * By default, this will invalidate featured list queries. This can result in
 * odd behavior because the featured list item order is randomized: when the
 * featured list cache is invalidated, the newly fetched data may be in a
 * different order. To maintain the order, use skipFeatured to skip invalidation
 * of featured lists and instead manually update the cached data via
 * `updateListParentsOnAdd`.
 */
const invalidateResourceQueries = (
  queryClient: QueryClient,
  resourceId: LearningResource["id"],
  { skipFeatured = false } = {},
) => {
  /**
   * Invalidate details queries.
   * In this case, looking up queries by key is easy.
   */
  queryClient.invalidateQueries(learningResources.detail(resourceId).queryKey)
  queryClient.invalidateQueries(
    learningResources.learningpaths._ctx.detail(resourceId).queryKey,
  )
  queryClient.invalidateQueries(
    learningResources.userlists._ctx.detail(resourceId).queryKey,
  )
  /**
   * Invalidate lists that the resource belongs to.
   * Check for actual membership.
   */
  const lists = [
    learningResources.list._def,
    learningResources.learningpaths._ctx.list._def,
    learningResources.search._def,
    ...(skipFeatured ? [] : [learningResources.featured._def]),
  ]
  lists.forEach((queryKey) => {
    queryClient.invalidateQueries({
      queryKey,
      predicate: listHasResource(resourceId),
    })
  })
}

/**
 * Invalidate Resource queries that a resource that belongs to user list appears in.
 */
const invalidateResourceWithUserListQueries = (
  queryClient: QueryClient,
  userListId: LearningResource["id"],
) => {
  /**
   * Invalidate resource detail query for resource that is in the user list.
   */
  queryClient.invalidateQueries({
    queryKey: learningResources.detail._def,
    predicate: resourceHasUserList(userListId),
  })

  /**
   * Invalidate lists with a resource that is in the user list.
   */
  const lists = [
    learningResources.list._def,
    learningResources.learningpaths._ctx.list._def,
    learningResources.search._def,
    learningResources.featured._def,
  ]

  lists.forEach((queryKey) => {
    queryClient.invalidateQueries({
      queryKey,
      predicate: resourcesHaveUserList(userListId),
    })
  })
}

const invalidateUserListQueries = (
  queryClient: QueryClient,
  userListId: UserList["id"],
) => {
  queryClient.invalidateQueries(
    learningResources.userlists._ctx.detail(userListId).queryKey,
  )
  const lists = [learningResources.userlists._ctx.list._def]

  lists.forEach((queryKey) => {
    queryClient.invalidateQueries({
      queryKey,
      predicate: listHasResource(userListId),
    })
  })
}

/**
 * Given
 *  - a list of learning resources L
 *  - a new relationship between learningpath/userlist and a resource R
 * Update the list L so that it includes the updated resource R. (If the list
 * did not contain R to begin with, no change is made)
 */
const updateListParentsOnAdd = (
  relationship: UserListRelationship,
  oldList?: PaginatedLearningResourceList,
) => {
  if (!oldList) return oldList
  const matchIndex = oldList.results.findIndex(
    (res) => res.id === relationship.child,
  )
  if (matchIndex === -1) return oldList
  const updatesResults = [...oldList.results]
  updatesResults[matchIndex] = relationship.resource
  return {
    ...oldList,
    results: updatesResults,
  }
}

/**
 * Given
 *  - a list of learning resources L
 *  - a destroyed relationship between learningpath/userlist and a resource R
 * Update the list L so that it includes the updated resource R. (If the list
 * did not contain R to begin with, no change is made)
 */
const updateListParentsOnDestroy = (
  relationship: MicroUserListRelationship,
  list?: PaginatedLearningResourceList,
) => {
  if (!list) return list
  if (!relationship) return list
  const matchIndex = list.results.findIndex(
    (res) => res.id === relationship.child,
  )
  if (matchIndex === -1) return list
  const updatedResults = [...list.results]
  const newResource = { ...updatedResults[matchIndex] }
  newResource.user_list_parents =
    newResource.user_list_parents?.filter((m) => m.id !== relationship.id) ??
    null
  updatedResults[matchIndex] = newResource
  return {
    ...list,
    results: updatedResults,
  }
}

/**
 * Given
 *  - a LearningResource ID
 *  - a paginated list of current resources
 *  - a list of new relationships
 *  - the type of list
 * Update the resources' user_list_parents field to include the new relationships
 */
const updateListParents = (
  resourceId: number,
  staleResources?: PaginatedLearningResourceList,
  newRelationships?: MicroUserListRelationship[],
  listType?: "userlist" | "learningpath",
) => {
  if (!resourceId || !staleResources || !newRelationships || !listType)
    return staleResources
  const matchIndex = staleResources.results.findIndex(
    (res) => res.id === resourceId,
  )
  if (matchIndex === -1) return staleResources
  const updatedResults = [...staleResources.results]
  const newResource = { ...updatedResults[matchIndex] }
  if (listType === "userlist") {
    newResource.user_list_parents = newRelationships
  }
  if (listType === "learningpath") {
    newResource.learning_path_parents = newRelationships
  }
  updatedResults[matchIndex] = newResource
  return {
    ...staleResources,
    results: updatedResults,
  }
}

export default learningResources
export {
  invalidateResourceQueries,
  invalidateUserListQueries,
  invalidateResourceWithUserListQueries,
  updateListParentsOnAdd,
  updateListParentsOnDestroy,
  updateListParents,
}
