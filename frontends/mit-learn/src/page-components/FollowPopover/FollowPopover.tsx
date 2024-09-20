import React, { useMemo } from "react"
import { Popover, Typography, styled, Button } from "ol-components"
import type { PopoverProps } from "ol-components"
import { getSearchParamMap } from "@/common/utils"

import { SignupPopover } from "../SignupPopover/SignupPopover"

import { useUserMe } from "api/hooks/user"
import { SourceTypeEnum } from "api"
import {
  useSearchSubscriptionCreate,
  useSearchSubscriptionDelete,
  useSearchSubscriptionList,
} from "api/hooks/searchSubscription"

const StyledPopover = styled(Popover)({
  width: "300px",
  maxWidth: "100vw",
})
const HeaderText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  marginBottom: "8px",
}))
const BodyText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.silverGrayDark,
  marginBottom: "16px",
}))

const Footer = styled.div({
  display: "flex",
  justifyContent: "end",
  gap: "16px",
})

interface FollowPopoverProps
  extends Pick<PopoverProps, "anchorEl" | "onClose" | "placement"> {
  itemName?: string
  searchParams: URLSearchParams
  sourceType: SourceTypeEnum
}

const FollowPopover: React.FC<FollowPopoverProps> = ({
  itemName,
  searchParams,
  sourceType,
  ...props
}) => {
  const { data: user } = useUserMe()
  const subscribeParams: Record<string, string[] | string> = useMemo(() => {
    return { source_type: sourceType, ...getSearchParamMap(searchParams) }
  }, [searchParams, sourceType])

  const subscriptionDelete = useSearchSubscriptionDelete()
  const subscriptionCreate = useSearchSubscriptionCreate()
  const subscriptionList = useSearchSubscriptionList(subscribeParams, {
    enabled: !!user?.is_authenticated,
  })
  const unsubscribe = subscriptionDelete.mutate
  const subscriptionId = subscriptionList.data?.[0]?.id

  const isSubscribed = !!subscriptionId
  const handleFollowAction = async (): Promise<void> => {
    props.onClose()
    if (!isSubscribed) {
      await subscriptionCreate.mutateAsync({
        PercolateQuerySubscriptionRequestRequest: subscribeParams,
      })
    } else {
      unsubscribe(subscriptionId)
    }
  }

  if (user?.is_authenticated && subscriptionList.isLoading) return null
  if (!user) return null
  if (!user?.is_authenticated) {
    return <SignupPopover {...props}></SignupPopover>
  }

  if (isSubscribed) {
    return (
      <StyledPopover {...props} open={!!props.anchorEl}>
        <HeaderText variant="subtitle2">
          You are following {itemName}
        </HeaderText>
        <BodyText variant="body2">
          Unfollow to stop getting emails for new {itemName} courses
        </BodyText>
        <Footer>
          <Button
            variant="inverted"
            data-testid="action-unfollow"
            onClick={handleFollowAction}
          >
            Unfollow
          </Button>
          <Button onClick={() => props.onClose()}>Close</Button>
        </Footer>
      </StyledPopover>
    )
  }
  return (
    <StyledPopover {...props} open={!!props.anchorEl}>
      <HeaderText variant="subtitle2">Follow {itemName}?</HeaderText>
      <BodyText variant="body2">
        You will get an email when new courses are available
      </BodyText>
      <Footer>
        <Button variant="inverted" onClick={() => props.onClose()}>
          Close
        </Button>
        <Button data-testid="action-follow" onClick={handleFollowAction}>
          Follow
        </Button>
      </Footer>
    </StyledPopover>
  )
}

export { FollowPopover }
export type { FollowPopoverProps }
