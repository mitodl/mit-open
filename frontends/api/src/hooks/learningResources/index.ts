import {
  UseQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { learningpathsApi } from "../../clients"
import type {
  LearningResourcesApiLearningResourcesListRequest as LRListRequest,
  TopicsApiTopicsListRequest as TopicsListRequest,
  LearningpathsApiLearningpathsResourcesListRequest as LPResourcesListRequest,
  LearningpathsApiLearningpathsListRequest as LPListRequest,
  LearningpathsApiLearningpathsCreateRequest as LPCreateRequest,
  LearningpathsApiLearningpathsDestroyRequest as LPDestroyRequest,
  LearningPathResource,
  LearningPathRelationshipRequest,
  MicroRelationship,
  LearningResource,
} from "../../generated"
import learningResources, { invalidateResourceQueries } from "./keyFactory"

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
      .detail(params.parent_id)
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
        // @ts-expect-error 'readable_id' and 'resource_type' are erroneously required
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
      learningpathsApi.learningpathsResourcesPartialUpdate({
        parent_id: parent,
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
      learningpathsApi.learningpathsResourcesCreate({
        parent_id: params.parent,
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
      queryClient.invalidateQueries(
        learningResources.learningpaths._ctx.detail(vars.parent)._ctx
          .infiniteItems._def,
      )
    },
  })
}

const useLearningpathRelationshipDestroy = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: MicroRelationship) =>
      learningpathsApi.learningpathsResourcesDestroy({
        id: params.id,
        parent_id: params.parent,
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
    onSettled: (response, _err, vars) => {
      invalidateResourceQueries(queryClient, vars.child)
      queryClient.invalidateQueries(
        learningResources.learningpaths._ctx.detail(vars.parent)._ctx
          .infiniteItems._def,
      )
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
}
