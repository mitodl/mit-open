import React, { useState, useEffect } from "react"

import {
  useSearchSubscriptionList,
  useSearchSubscriptionCreate,
  useSearchSubscriptionDelete,
} from "api/hooks/searchSubscription"

const SearchSubscriptionToggle = ({ queryParams }) => {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [queryId, setQueryId] = useState(null)

  const { data } = useSearchSubscriptionList(queryParams)
  const subscriptionDelete = useSearchSubscriptionDelete()
  const subscriptionCreate = useSearchSubscriptionCreate()

  console.log(queryParams)
  useEffect(() => {
    if (data?.length > 0 && data[0].id) {
      const queryId = data[0].id
      console.log("subscribed data", data)
      setIsSubscribed(true)
      setQueryId(queryId)
    } else {
      setIsSubscribed(false)
      setQueryId(null)
    }
  }, [data])

  const handleToggleSubscription = () => {
    if (isSubscribed && queryId) {
      // Unsubscribe logic
      //
      console.log("unsubscribing")
      subscriptionDelete
        .mutateAsync(queryId)
        .then(() => {
          setIsSubscribed(false)
          setQueryId(null)
        })
        .catch((error) => console.error("Error unsubscribing:", error))
    } else {
      // Subscribe logic
      subscriptionCreate.mutateAsync(queryParams)
    }
  }

  return (
    <button onClick={handleToggleSubscription}>
      {isSubscribed ? "Unsubscribe" : "Subscribe"}
    </button>
  )
}

export { SearchSubscriptionToggle }
