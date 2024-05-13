import { searchSubscriptionApi } from "../../clients"
import { createQueryKeys } from "@lukemorales/query-key-factory"
import type { LearningResourcesUserSubscriptionApiLearningResourcesUserSubscriptionCheckListRequest as subscriptionCheckListRequest } from "../../generated/v1"
const searchSubscriptions = createQueryKeys("searchSubscriptions", {
  list: (params: subscriptionCheckListRequest) => ({
    queryKey: [params],
    queryFn: () => {
      return searchSubscriptionApi
        .learningResourcesUserSubscriptionCheckList(params)
        .then((res) => res.data)
    },
  }),
})

export default searchSubscriptions
