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
const SearchSubscriptionToggle = ({ queryParams }) => {
  const buttonSx: React.CSSProperties = {
    backgroundColor: "#a31f34",
    color: "#fff",
    margin: 0,
    border: "none",
    fontWeight: "400",
    fontSize: "16px",
    textDecoration: "none",
    cursor: "pointer",
    width: "120px",
    borderRadius: "0px",
  }
  const unsubscribeSx: React.CSSProperties = {
    bgcolor: "background.paper",
    fontSize: "16px",
    width: "120px",
    fontWeight: "400",
  }

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [open, setOpen] = React.useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [queryId, setQueryId] = useState(null)
  const { data } = useSearchSubscriptionList(queryParams)
  const subscriptionDelete = useSearchSubscriptionDelete()
  const subscriptionCreate = useSearchSubscriptionCreate()

  useEffect(() => {
    if (data?.length > 0 && data[0].id) {
      const queryId = data[0].id
      setIsSubscribed(true)
      setQueryId(queryId)
    } else {
      setIsSubscribed(false)
      setQueryId(null)
    }
  }, [data])

  const handleToggleSubscription = () => {
    setOpen(false)
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
        setQueryId(data.id)
      })
    }
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
    setOpen((previousOpen) => !previousOpen)
  }

  const id = open ? "unsubscribe-popper" : undefined

  return isSubscribed ? (
    <PopupState variant="popper" popupId="demo-popup-popper">
      {(popupState) => (
        <div>
          <Button
            endIcon={<ExpandMoreSharpIcon />}
            style={buttonSx}
            width={100}
            aria-describedby={id}
            onClick={handleClick}
            {...bindToggle(popupState)}
          >
            Subscribed
          </Button>
          <Popper id={id} {...bindPopper(popupState)}>
            <Box width={100} sx={unsubscribeSx} alignItems="center">
              <MenuItem width={100} onClick={handleToggleSubscription}>
                Unsubscribe
              </MenuItem>
            </Box>
          </Popper>
        </div>
      )}
    </PopupState>
  ) : (
    <div>
      <Button fullWidth style={buttonSx} onClick={handleToggleSubscription}>
        Subscribe
      </Button>
    </div>
  )
}

export { SearchSubscriptionToggle }
