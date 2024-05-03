import React, { useState, useEffect } from "react"

import {
  useSearchSubscriptionList,
  useSearchSubscriptionCreate,
  useSearchSubscriptionDelete,
} from "api/hooks/searchSubscription"
import { Button } from "ol-components"
import Box from "@mui/material/Box"
import Popper from "@mui/material/Popper"
import MenuItem from "@mui/material/MenuItem"
import ExpandMoreSharpIcon from "@mui/icons-material/ExpandMoreSharp"
import PopupState, { bindToggle, bindPopper } from "material-ui-popup-state"
import { useUserMe } from "api/hooks/user"

const SearchSubscriptionToggle = ({
  searchParams,
}: {
  searchParams: URLSearchParams
}) => {
  const queryParams = Object.fromEntries(searchParams.entries())
  for (const [key, value] of Object.entries(queryParams)) {
    queryParams[key] = value.split(",")
  }
  const buttonSx: React.CSSProperties = {
    backgroundColor: "#a31f34",
    color: "#fff",
    margin: 0,
    border: "none",
    fontWeight: "400",
    fontSize: "16px",
    textDecoration: "none",
    cursor: "pointer",
    width: "125px",
    borderRadius: "0px",
  }

  const { data: user } = useUserMe()

  const [isSubscribed, setIsSubscribed] = useState(false)
  const [queryId, setQueryId] = useState<null | number>(null)
  const { data } = useSearchSubscriptionList(queryParams)
  const subscriptionDelete = useSearchSubscriptionDelete()
  const subscriptionCreate = useSearchSubscriptionCreate()
  const id = "unsubscribe-popper"

  useEffect(() => {
    if (data && data.length > 0) {
      setIsSubscribed(true)
      setQueryId(data[0]?.id)
    } else {
      setIsSubscribed(false)
      setQueryId(null)
    }
  }, [data])

  const handleToggleSubscription = () => {
    if (isSubscribed && queryId) {
      // Unsubscribe logic
      setIsSubscribed(false)
      subscriptionDelete.mutateAsync(queryId).then(() => {
        setQueryId(null)
      })
    } else {
      // Subscribe logic
      setIsSubscribed(true)
      subscriptionCreate.mutateAsync(queryParams).then((data) => {
        setQueryId(data?.id)
      })
    }
  }
  if (!user?.is_authenticated) {
    return null
  }

  return isSubscribed ? (
    <PopupState variant="popper" popupId="demo-popup-popper">
      {(popupState) => (
        <div>
          <Button
            endIcon={<ExpandMoreSharpIcon />}
            style={buttonSx}
            aria-describedby={id}
            {...bindToggle(popupState)}
          >
            Subscribed
          </Button>
          <Popper id={id} {...bindPopper(popupState)}>
            <Box
              sx={{
                bgcolor: "background.paper",
                fontSize: "16px",
                width: "125px",
                fontWeight: "400",
              }}
              alignItems="center"
            >
              <MenuItem onClick={handleToggleSubscription}>
                Unsubscribe
              </MenuItem>
            </Box>
          </Popper>
        </div>
      )}
    </PopupState>
  ) : (
    <div>
      <Button style={buttonSx} onClick={handleToggleSubscription}>
        Subscribe
      </Button>
    </div>
  )
}

export { SearchSubscriptionToggle }
