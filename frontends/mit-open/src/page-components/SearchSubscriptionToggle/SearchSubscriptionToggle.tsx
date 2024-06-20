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
import { SignupPopover } from "../SignupPopover/SignupPopover"

type SearchSubscriptionToggleProps = {
  searchParams: URLSearchParams
  sourceType: SourceTypeEnum
}

const SearchSubscriptionToggle: React.FC<SearchSubscriptionToggleProps> = ({
  searchParams,
  sourceType,
}) => {
  const [buttonEl, setButtonEl] = React.useState<null | HTMLElement>(null)
  const subscribeParams: Record<string, string[] | string> = useMemo(() => {
    return { source_type: sourceType, ...getSearchParamMap(searchParams) }
  }, [searchParams, sourceType])

  const { data: user } = useUserMe()
  const subscriptionDelete = useSearchSubscriptionDelete()
  const subscriptionCreate = useSearchSubscriptionCreate()
  const subscriptionList = useSearchSubscriptionList(subscribeParams, {
    enabled: !!user?.is_authenticated,
  })

  const unsubscribe = subscriptionDelete.mutate
  const subscriptionId = subscriptionList.data?.[0]?.id
  const isSubscribed = !!subscriptionId
  const unsubscribeItems: SimpleMenuItem[] = useMemo(() => {
    if (!subscriptionId) return []
    return [
      {
        key: "unsubscribe",
        label: "Unfollow",
        onClick: () => unsubscribe(subscriptionId),
      },
    ]
  }, [unsubscribe, subscriptionId])

  if (user?.is_authenticated && subscriptionList.isLoading) return null
  if (!user) return null
  if (isSubscribed) {
    return (
      <SimpleMenu
        trigger={
          <Button variant="primary" endIcon={<ExpandMoreSharpIcon />}>
            Following
          </Button>
        }
        items={unsubscribeItems}
      />
    )
  }
  return (
    <>
      <Button
        variant="primary"
        disabled={subscriptionCreate.isLoading}
        startIcon={<MailOutlineIcon />}
        onClick={(e) => {
          if (user?.is_authenticated) {
            subscriptionCreate.mutateAsync({
              PercolateQuerySubscriptionRequestRequest: subscribeParams,
            })
          } else {
            setButtonEl(e.currentTarget)
          }
        }}
      >
        Follow
      </Button>
      <SignupPopover anchorEl={buttonEl} onClose={() => setButtonEl(null)} />
    </>
  )
}

export { SearchSubscriptionToggle }
export type { SearchSubscriptionToggleProps }
