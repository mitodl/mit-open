import { searchSubscriptionApi } from "../../clients"
import { createQueryKeys } from "@lukemorales/query-key-factory"
import type { LearningResourcesUserSubscriptionApiLearningResourcesUserSubscriptionListRequest as subscriptionListRequest } from "../../generated/v1"
const searchSubscriptions = createQueryKeys("searchSubscriptions", {
  list: (params: subscriptionListRequest) => ({
    queryKey: [params],
    queryFn: () => {
      console.log("query fn ", params)
      return searchSubscriptionApi
        .learningResourcesUserSubscriptionList(params)
        .then((res) => res.data)
    },
  }),
})

export default searchSubscriptions
