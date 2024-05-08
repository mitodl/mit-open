import React, { useState, useEffect, useMemo } from "react"

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
  const subscribeParams: Record<string, string[]> = useMemo(() => {
    const params: Record<string, string[]> = {}
    for (const [key, value] of searchParams.entries()) {
      params[key] = value.split(",")
    }
    return params
  }, [searchParams])

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
  const [ready, setReady] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [queryId, setQueryId] = useState<null | number>(null)

  const subscriptionDelete = useSearchSubscriptionDelete()
  const subscriptionCreate = useSearchSubscriptionCreate()
  const subscriptionList = useSearchSubscriptionList()
  const id = "unsubscribe-popper"

  useEffect(() => {
    if (
      !user?.is_authenticated ||
      Object.keys(subscribeParams).length === 0 ||
      ready === true
    )
      return
    subscriptionList.mutateAsync(subscribeParams).then((data) => {
      if (data && data.length > 0) {
        setIsSubscribed(true)
        setQueryId(data[0]?.id)
      } else {
        setIsSubscribed(false)
        setQueryId(null)
      }
    })
    setReady(true)
  }, [user, subscribeParams, ready, subscriptionList])

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
      subscriptionCreate.mutateAsync(subscribeParams).then((data) => {
        setQueryId(data?.id)
      })
    }
  }

  return isSubscribed ? (
    <PopupState variant="popper" popupId="unsubscribe-popper">
      {(popupState) => (
        <div>
          {ready ? (
            <>
              <Button
                endIcon={<ExpandMoreSharpIcon />}
                style={buttonSx}
                aria-describedby={id}
                aria-label="unsubscribe-button"
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
            </>
          ) : (
            <Button style={buttonSx}></Button>
          )}
        </div>
      )}
    </PopupState>
  ) : (
    <div>
      {ready ? (
        <Button
          aria-label="subscribe-button"
          style={buttonSx}
          onClick={handleToggleSubscription}
        >
          Subscribe
        </Button>
      ) : (
        <Button style={buttonSx}></Button>
      )}
    </div>
  )
}

export { SearchSubscriptionToggle }
