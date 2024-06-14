import React, { useMemo } from "react"
import { getSearchParamMap } from "@/common/utils"
import {
  useSearchSubscriptionCreate,
  useSearchSubscriptionDelete,
  useSearchSubscriptionList,
} from "api/hooks/searchSubscription"
import { Button, SimpleMenu } from "ol-components"
import type { SimpleMenuItem } from "ol-components"
import ExpandMoreSharpIcon from "@mui/icons-material/ExpandMoreSharp"
import { useUserMe } from "api/hooks/user"
import { SourceTypeEnum } from "api"
import MailOutlineIcon from "@mui/icons-material/MailOutline"

const SearchSubscriptionToggle = ({
  searchParams,
  sourceType,
}: {
  searchParams: URLSearchParams
  sourceType: SourceTypeEnum
}) => {
  const subscribeParams: Record<string, string[] | string> = useMemo(() => {
    return { source_type: sourceType, ...getSearchParamMap(searchParams) }
  }, [searchParams, sourceType])

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
          <Button variant="primary" endIcon={<ExpandMoreSharpIcon />}>
            Subscribed
          </Button>
        }
        items={unsubscribeItems}
      />
    )
  }
  return (
    <Button
      variant="primary"
      disabled={subscriptionCreate.isLoading}
      startIcon={<MailOutlineIcon />}
      onClick={() =>
        subscriptionCreate.mutateAsync({
          PercolateQuerySubscriptionRequestRequest: subscribeParams,
        })
      }
    >
      Subscribe
    </Button>
  )
}

export { SearchSubscriptionToggle }
