import {
  UseQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { learningpathsApi, userListsApi } from "../../clients"
import type {
  LearningResourcesApiLearningResourcesListRequest as LRListRequest,
  TopicsApiTopicsListRequest as TopicsListRequest,
  LearningpathsApiLearningpathsItemsListRequest as LPResourcesListRequest,
  LearningpathsApiLearningpathsListRequest as LPListRequest,
  LearningpathsApiLearningpathsCreateRequest as LPCreateRequest,
  LearningpathsApiLearningpathsDestroyRequest as LPDestroyRequest,
  LearningPathResource,
  LearningPathRelationshipRequest,
  MicroLearningPathRelationship,
  LearningResource,
  LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest as LRSearchRequest,
  UserlistsApiUserlistsListRequest as ULListRequest,
  UserlistsApiUserlistsItemsListRequest as ULItemsListRequest,
  OfferorsApiOfferorsListRequest,
} from "../../generated/v1"
import learningResources, { invalidateResourceQueries } from "./keyFactory"
import {
  LIST_TYPE_LEARNING_PATH,
  LIST_TYPE_USER_LIST,
} from "../../common/constants"

const useLearningResourcesList = (
  params: LRListRequest = {},
  opts: Pick<UseQueryOptions, "enabled"> = {},
) => {
  return useQuery({
    ...learningResources.list(params),
    ...opts,
  })
}

const useLearningResourcesDetail = (id: number) => {
  return useQuery(learningResources.detail(id))
}

const useLearningResourceTopics = (
  params: TopicsListRequest = {},
  opts: Pick<UseQueryOptions, "enabled"> = {},
) => {
  return useQuery({
    ...learningResources.topics(params),
    ...opts,
  })
}

const useLearningPathsList = (
  params: LPListRequest = {},
  opts: Pick<UseQueryOptions, "enabled"> = {},
) => {
  return useQuery({
    ...learningResources.learningpaths._ctx.list(params),
    ...opts,
  })
}

const useLearningPathsDetail = (id: number) => {
  return useQuery(learningResources.learningpaths._ctx.detail(id))
}

const useInfiniteLearningPathItems = (
  params: LPResourcesListRequest,
  options: Pick<UseQueryOptions, "enabled"> = {},
) => {
  return useInfiniteQuery({
    ...learningResources.learningpaths._ctx
      .detail(params.learning_resource_id)
      ._ctx.infiniteItems(params),
    getNextPageParam: (lastPage) => {
      return lastPage.next ?? undefined
    },
    ...options,
  })
}

type LearningPathCreateRequest = Omit<
  LPCreateRequest["LearningPathResourceRequest"],
  "readable_id" | "resource_type"
>
const useLearningpathCreate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: LearningPathCreateRequest) =>
      learningpathsApi.learningpathsCreate({
        LearningPathResourceRequest: params,
      }),
    onSettled: () => {
      // Invalidate everything: this is over-aggressive, but the new resource
      // could appear in most lists
      queryClient.invalidateQueries(learningResources._def)
    },
  })
}
const useLearningpathUpdate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (
      params: Pick<LearningPathResource, "id"> & Partial<LearningPathResource>,
    ) =>
      learningpathsApi.learningpathsPartialUpdate({
        id: params.id,
        PatchedLearningPathResourceRequest: params,
      }),
    onSettled: (_data, _err, vars) => {
      invalidateResourceQueries(queryClient, vars.id)
    },
  })
}

const useLearningpathDestroy = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: LPDestroyRequest) =>
      learningpathsApi.learningpathsDestroy(params),
    onSettled: (_data, _err, vars) => {
      invalidateResourceQueries(queryClient, vars.id)
    },
  })
}

interface LearningpathMoveRequest {
  parent: number
  id: number
  position?: number
}
const useLearningpathRelationshipMove = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ parent, id, position }: LearningpathMoveRequest) =>
      learningpathsApi.learningpathsItemsPartialUpdate({
        learning_resource_id: parent,
        id,
        PatchedLearningPathRelationshipRequest: { position },
      }),
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries(
        learningResources.learningpaths._ctx.detail(vars.parent)._ctx
          .infiniteItems._def,
      )
    },
  })
}

const useLearningpathRelationshipCreate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: LearningPathRelationshipRequest) =>
      learningpathsApi.learningpathsItemsCreate({
        learning_resource_id: params.parent,
        LearningPathRelationshipRequest: params,
      }),
    onSuccess: (response, _vars) => {
      queryClient.setQueryData(
        learningResources.detail(response.data.child).queryKey,
        response.data.resource,
      )
    },
    onSettled: (response, _err, vars) => {
      invalidateResourceQueries(queryClient, vars.child)
      invalidateResourceQueries(queryClient, vars.parent)
    },
  })
}

const useLearningpathRelationshipDestroy = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: MicroLearningPathRelationship) =>
      learningpathsApi.learningpathsItemsDestroy({
        id: params.id,
        learning_resource_id: params.parent,
      }),
    onSuccess: (_response, vars) => {
      queryClient.setQueryData(
        learningResources.detail(vars.child).queryKey,
        (old: LearningResource | undefined) => {
          if (!old) return
          const parents =
            old.learning_path_parents?.filter(({ id }) => vars.id !== id) ?? []
          return {
            ...old,
            learning_path_parents: parents,
          }
        },
      )
    },
    onSettled: (_response, _err, vars) => {
      invalidateResourceQueries(queryClient, vars.child)
      invalidateResourceQueries(queryClient, vars.parent)
    },
  })
}

const useLearningResourcesSearch = (
  params: LRSearchRequest,
  opts?: Pick<UseQueryOptions, "keepPreviousData">,
) => {
  return useQuery({
    ...learningResources.search(params),
    ...opts,
  })
}

const useUserListList = (
  params: ULListRequest = {},
  opts: Pick<UseQueryOptions, "enabled"> = {},
) => {
  return useQuery({
    ...learningResources.userlists._ctx.list(params),
    ...opts,
  })
}

const useUserListsDetail = (id: number) => {
  return useQuery(learningResources.userlists._ctx.detail(id))
}

const useInfiniteUserListItems = (
  params: ULItemsListRequest,
  options: Pick<UseQueryOptions, "enabled"> = {},
) => {
  return useInfiniteQuery({
    ...learningResources.userlists._ctx
      .detail(params.userlist_id)
      ._ctx.infiniteItems(params),
    getNextPageParam: (lastPage) => {
      return lastPage.next ?? undefined
    },
    ...options,
  })
}

const useOfferorsList = (
  params: OfferorsApiOfferorsListRequest = {},
  opts: Pick<UseQueryOptions, "enabled"> = {},
) => {
  return useQuery({
    ...learningResources.offerors(params),
    ...opts,
  })
}

/* The `LIST_TYPE_` constants are used to differentiate between
  different types of lists in the application. In this specific code
  snippet, `LIST_TYPE_LEARNING_PATH` and `LIST_TYPE_USER_LIST` are
  used to specify the type of list being operated on when moving
  items within a list. This helps in determining whether the item
  should be moved within a learning path or a user list. */
interface ListItemMoveRequest {
  listType: string
  parent: number
  id: number
  position?: number
}
const useListItemMove = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      listType,
      parent,
      id,
      position,
    }: ListItemMoveRequest) => {
      if (listType === LIST_TYPE_LEARNING_PATH) {
        await learningpathsApi.learningpathsItemsPartialUpdate({
          learning_resource_id: parent,
          id,
          PatchedLearningPathRelationshipRequest: { position },
        })
      } else if (listType === LIST_TYPE_USER_LIST) {
        await userListsApi.userlistsItemsPartialUpdate({
          userlist_id: parent,
          id,
          PatchedUserListRelationshipRequest: { position },
        })
      }
    },
    onSettled: (_data, _err, vars) => {
      if (vars.listType === LIST_TYPE_LEARNING_PATH) {
        queryClient.invalidateQueries(
          learningResources.learningpaths._ctx.detail(vars.parent)._ctx
            .infiniteItems._def,
        )
      } else if (vars.listType === LIST_TYPE_USER_LIST) {
        queryClient.invalidateQueries(
          learningResources.userlists._ctx.detail(vars.parent)._ctx
            .infiniteItems._def,
        )
      }
    },
  })
}

export {
  useLearningResourcesList,
  useLearningResourcesDetail,
  useLearningResourceTopics,
  useLearningPathsList,
  useLearningPathsDetail,
  useInfiniteLearningPathItems,
  useLearningpathCreate,
  useLearningpathUpdate,
  useLearningpathDestroy,
  useLearningpathRelationshipMove,
  useLearningpathRelationshipCreate,
  useLearningpathRelationshipDestroy,
  useLearningResourcesSearch,
  useUserListList,
  useUserListsDetail,
  useInfiniteUserListItems,
  useOfferorsList,
  useListItemMove,
}
