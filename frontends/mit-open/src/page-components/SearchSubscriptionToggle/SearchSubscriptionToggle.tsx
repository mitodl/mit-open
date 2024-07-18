import React, { useState, useMemo } from "react"
import { getSearchParamMap } from "@/common/utils"
import {
  useSearchSubscriptionCreate,
  useSearchSubscriptionDelete,
  useSearchSubscriptionList,
} from "api/hooks/searchSubscription"
import { Button, SimpleMenu, BasicDialog, styled } from "ol-components"
import type { SimpleMenuItem } from "ol-components"
import { RiArrowDownSLine, RiMailLine } from "@remixicon/react"
import { useUserMe } from "api/hooks/user"
import { SourceTypeEnum } from "api"

import { SignupPopover } from "../SignupPopover/SignupPopover"

const StyledButton = styled(Button)({
  minWidth: "130px",
})

type SearchSubscriptionToggleProps = {
  itemName: string
  searchParams: URLSearchParams
  sourceType: SourceTypeEnum
}

const SearchSubscriptionToggle: React.FC<SearchSubscriptionToggleProps> = ({
  itemName,
  searchParams,
  sourceType,
}) => {
  const [buttonEl, setButtonEl] = useState<null | HTMLElement>(null)
  const [confirmationOpen, setConfirmationOpen] = useState(false)

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

  const onFollowClick = (event: React.MouseEvent<HTMLElement>) => {
    if (user?.is_authenticated) {
      setConfirmationOpen(true)
    } else {
      setButtonEl(event.currentTarget)
    }
  }

  const onConfirmClick = () => {
    subscriptionCreate.mutateAsync({
      PercolateQuerySubscriptionRequestRequest: subscribeParams,
    })
  }

  if (user?.is_authenticated && subscriptionList.isLoading) return null
  if (!user) return null

  if (isSubscribed) {
    return (
      <SimpleMenu
        trigger={
          <StyledButton variant="primary" endIcon={<RiArrowDownSLine />}>
            Following
          </StyledButton>
        }
        items={unsubscribeItems}
      />
    )
  }

  return (
    <>
      <StyledButton
        variant="primary"
        disabled={subscriptionCreate.isLoading}
        startIcon={<RiMailLine />}
        onClick={onFollowClick}
      >
        Follow
      </StyledButton>
      <BasicDialog
        title={`Follow ${itemName}?`}
        message="You will get emailed when new courses are available. Go to Email Notifications in your account profile to manage settings."
        confirmText="Got it!"
        open={confirmationOpen}
        onConfirm={onConfirmClick}
        onClose={() => setConfirmationOpen(false)}
      />
      <SignupPopover anchorEl={buttonEl} onClose={() => setButtonEl(null)} />
    </>
  )
}

export { SearchSubscriptionToggle }
export type { SearchSubscriptionToggleProps }
