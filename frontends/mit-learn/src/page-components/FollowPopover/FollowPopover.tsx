import React, { useMemo } from "react"
import { Popover, Typography, styled, ButtonLink, Button } from "ol-components"
import type { PopoverProps } from "ol-components"
import { getSearchParamMap } from "@/common/utils"
import * as urls from "@/common/urls"
import { useLocation } from "react-router"
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
})

const ButtonsContainer = styled.div(({ theme }) => ({
  display: "flex",
  justifyContent: "right",
  margin: "4px auto 0",
  gap: "16px",
  [theme.breakpoints.down("sm")]: {
    marginTop: "16px",
  },
}))

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

  const loc = useLocation()
  const subscriptionDelete = useSearchSubscriptionDelete()
  const subscriptionCreate = useSearchSubscriptionCreate()
  const subscriptionList = useSearchSubscriptionList(subscribeParams, {
    enabled: !!user?.is_authenticated,
  })
  const unsubscribe = subscriptionDelete.mutate
  const subscriptionId = subscriptionList.data?.[0]?.id

  const isSubscribed = !!subscriptionId
  const handleFollowAction = async (): Promise<void> => {
    if (!isSubscribed) {
      await subscriptionCreate.mutateAsync({
        PercolateQuerySubscriptionRequestRequest: subscribeParams,
      })
    } else {
      unsubscribe(subscriptionId)
    }
    props.onClose()
  }

  if (user?.is_authenticated && subscriptionList.isLoading) return null
  if (!user) return null
  if (!user?.is_authenticated) {
    return (
      <StyledPopover {...props} open={!!props.anchorEl}>
        <HeaderText variant="subtitle2">
          Join {APP_SETTINGS.SITE_NAME} for free.
        </HeaderText>
        <BodyText variant="body2">
          As a member, get personalized recommendations, curate learning lists,
          and follow your areas of interest.
        </BodyText>
        <Footer>
          <ButtonLink
            href={urls.login({
              pathname: loc.pathname,
              search: loc.search,
            })}
          >
            Sign Up
          </ButtonLink>
        </Footer>
      </StyledPopover>
    )
  }

  if (isSubscribed) {
    return (
      <>
        <StyledPopover {...props} open={!!props.anchorEl}>
          <HeaderText variant="subtitle2">
            You are following {itemName}
          </HeaderText>
          <BodyText variant="body2">
            Unfollow to stop getting emails for new {itemName} courses
          </BodyText>
          <Footer>
            <ButtonsContainer>
              <Button variant="inverted" onClick={handleFollowAction}>
                Unfollow
              </Button>
              <Button onClick={() => props.onClose()}>Close</Button>
            </ButtonsContainer>
          </Footer>
        </StyledPopover>
      </>
    )
  }
  return (
    <>
      <StyledPopover {...props} open={!!props.anchorEl}>
        <HeaderText variant="subtitle2">Follow {itemName}?</HeaderText>
        <BodyText variant="body2">
          You will get an email when new courses are available
        </BodyText>
        <Footer>
          <ButtonsContainer>
            <Button variant="inverted" onClick={() => props.onClose()}>
              Close
            </Button>
            <Button onClick={handleFollowAction}>Follow</Button>
          </ButtonsContainer>
        </Footer>
      </StyledPopover>
    </>
  )
}

export { FollowPopover }
export type { FollowPopoverProps }
