import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import searchSubscriptions from "./keyFactory"
import type {
  LearningResourcesUserSubscriptionApiLearningResourcesUserSubscriptionListRequest as subscriptionListRequest,
  LearningResourcesUserSubscriptionApiLearningResourcesUserSubscriptionSubscribeCreateRequest as subscriptionCreateRequest,
} from "../../generated/v1"
import { searchSubscriptionApi } from "../../clients"
/**
 * Query is diabled if id is undefined.
 */
const useUserSubscriptionList = (params: subscriptionListRequest = {}) => {
  return useQuery({
    ...searchSubscriptions.list(params),
  })
}

const useUserSubscriptionCreate = () => {
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

const useUserSubscriptionDelete = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number | undefined) => {
      console.log("deleteid", id)
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
  useUserSubscriptionList,
  useUserSubscriptionCreate,
  useUserSubscriptionDelete,
}
