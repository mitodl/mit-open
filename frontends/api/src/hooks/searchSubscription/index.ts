import {
  useMutation,
  UseQueryOptions,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query"
import searchSubscriptions from "./keyFactory"
import type { LearningResourcesUserSubscriptionApiLearningResourcesUserSubscriptionSubscribeCreateRequest as subscriptionCreateRequest } from "@mitodl/open-api-axios/v1"
import { searchSubscriptionApi } from "../../clients"

const useSearchSubscriptionCreate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: subscriptionCreateRequest = {}) =>
      searchSubscriptionApi
        .learningResourcesUserSubscriptionSubscribeCreate(params)
        .then((res) => res.data),
    onSuccess: (_data) => {
      queryClient.invalidateQueries(searchSubscriptions._def)
    },
  })
}

const useSearchSubscriptionList = (
  params = {},
  opts: Pick<UseQueryOptions, "enabled"> = {},
) => {
  return useQuery({
    ...searchSubscriptions.list(params),
    ...opts,
  })
}

const useSearchSubscriptionDelete = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => {
      return searchSubscriptionApi
        .learningResourcesUserSubscriptionUnsubscribeDestroy({ id })
        .then((res) => res.data)
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries(searchSubscriptions._def)
    },
  })
}

export {
  useSearchSubscriptionList,
  useSearchSubscriptionCreate,
  useSearchSubscriptionDelete,
}
