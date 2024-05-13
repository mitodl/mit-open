import React, { useMemo } from "react"

import {
  useSearchSubscriptionCreate,
  useSearchSubscriptionDelete,
  useSearchSubscriptionList,
} from "api/hooks/searchSubscription"
import { Button, SimpleMenu } from "ol-components"
import type { SimpleMenuItem } from "ol-components"
import ExpandMoreSharpIcon from "@mui/icons-material/ExpandMoreSharp"
import { useUserMe } from "api/hooks/user"

const SearchSubscriptionToggle = ({
  searchParams,
}: {
  searchParams: URLSearchParams
}) => {
  const subscribeParams: Record<string, string[]> = useMemo(() => {
    const params: Record<string, string[]> = {}
    for (const [key] of searchParams.entries()) {
      const paramValues = searchParams.getAll(key)
      const finalparams = paramValues.map((p) => {
        return p.indexOf(",") !== -1 ? p.split(",") : p
      })
      params[key] = finalparams.flat()
    }
    return params
  }, [searchParams])

  const { data: user } = useUserMe()
  const subscriptionDelete = useSearchSubscriptionDelete()
  const subscriptionCreate = useSearchSubscriptionCreate()
  const subscriptionList = useSearchSubscriptionList(subscribeParams, {
    enabled: user?.is_authenticated,
  })

  const unsubscribe = subscriptionDelete.mutate
  const subscriptionId = subscriptionList.data?.[0]?.id
  const isSubscribed = !!subscriptionId
  const unsubscribeItems: SimpleMenuItem[] = useMemo(() => {
    if (!subscriptionId) return []
    return [
      {
        key: "unsubscribe",
        label: "Unsubscribe",
        onClick: () => unsubscribe(subscriptionId),
      },
    ]
  }, [unsubscribe, subscriptionId])

  if (subscriptionList.isLoading) return null
  if (!user?.is_authenticated) return null
  if (isSubscribed) {
    return (
      <SimpleMenu
        trigger={
          <Button variant="filled" endIcon={<ExpandMoreSharpIcon />}>
            Subscribed
          </Button>
        }
        items={unsubscribeItems}
      />
    )
  }
  return (
    <Button
      variant="filled"
      disabled={subscriptionCreate.isLoading}
      onClick={() =>
        subscriptionCreate.mutateAsync({
          LearningResourcesSearchRequestRequest: subscribeParams,
        })
      }
    >
      Subscribe
    </Button>
  )
}

export { SearchSubscriptionToggle }
