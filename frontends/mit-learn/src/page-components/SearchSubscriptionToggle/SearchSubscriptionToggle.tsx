import React, { useMemo } from "react"
import { getSearchParamMap } from "@/common/utils"
import {
  useSearchSubscriptionCreate,
  useSearchSubscriptionList,
} from "api/hooks/searchSubscription"
import { Button, styled } from "ol-components"

import { RiMailLine } from "@remixicon/react"
import { useUserMe } from "api/hooks/user"
import { SourceTypeEnum } from "api"
import { FollowPopover } from "../FollowPopover/FollowPopover"

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

  const subscribeParams: Record<string, string[] | string> = useMemo(() => {
    return { source_type: sourceType, ...getSearchParamMap(searchParams) }
  }, [searchParams, sourceType])

  const { data: user } = useUserMe()

  const subscriptionCreate = useSearchSubscriptionCreate()
  const subscriptionList = useSearchSubscriptionList(subscribeParams, {
    enabled: !!user?.is_authenticated,
  })

  const subscriptionId = subscriptionList.data?.[0]?.id
  const isSubscribed = !!subscriptionId

  const onFollowClick = async (event: React.MouseEvent<HTMLElement>) => {
    setButtonEl(event.currentTarget)
  }

  if (user?.is_authenticated && subscriptionList.isLoading) return null
  if (!user) return null

  if (isSubscribed) {
    return (
      <>
        <StyledButton
          variant="success"
          onClick={onFollowClick}
          startIcon={<RiMailLine />}
        >
          Following
        </StyledButton>
        <FollowPopover
          searchParams={searchParams}
          itemName={itemName}
          sourceType={sourceType}
          anchorEl={buttonEl}
          onClose={() => setButtonEl(null)}
        />
      </>
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
      <FollowPopover
        searchParams={searchParams}
        itemName={itemName}
        sourceType={sourceType}
        anchorEl={buttonEl}
        onClose={() => setButtonEl(null)}
      />
    </>
  )
}

export { SearchSubscriptionToggle }
export type { SearchSubscriptionToggleProps }
