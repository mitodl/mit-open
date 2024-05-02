import React, { useState, useEffect } from "react"

import {
  useSearchSubscriptionList,
  useSearchSubscriptionCreate,
  useSearchSubscriptionDelete,
} from "api/hooks/searchSubscription"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp"

import { DropdownMenu } from "./DropdownMenu"
/*

.follow-button,
    .edit-button {
      margin-right: 0;
      margin-left: 10px;
    }

    .follow-button {
      flex-grow: 1;
      padding: $button-vert-padding 0;
      min-width: 110px;
      max-width: 145px;
      text-align: center;
    }

    .dropdown-button {
      position: relative;

      span {
        display: inline-block;
        padding-right: 10px;
      }
*/
const SearchSubscriptionToggle = ({ queryParams }) => {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [queryId, setQueryId] = useState(null)
  const isDropdownOpen = true
  const { data } = useSearchSubscriptionList(queryParams)
  const subscriptionDelete = useSearchSubscriptionDelete()
  const subscriptionCreate = useSearchSubscriptionCreate()

  console.log(queryParams)
  useEffect(() => {
    if (data?.length > 0 && data[0].id) {
      const queryId = data[0].id
      console.log("subscribed data", data)
      setIsSubscribed(true)
      setQueryId(queryId)
    } else {
      setIsSubscribed(false)
      setQueryId(null)
    }
  }, [data])

  const handleToggleSubscription = () => {
    if (isSubscribed && queryId) {
      // Unsubscribe logic
      //
      console.log("unsubscribing")
      subscriptionDelete
        .mutateAsync(queryId)
        .then(() => {
          setIsSubscribed(false)
          setQueryId(null)
        })
        .catch((error) => console.error("Error unsubscribing:", error))
    } else {
      // Subscribe logic
      subscriptionCreate.mutateAsync(queryParams)
    }
  }

  return isSubscribed ? (
    <React.Fragment>
      <a className="follow-button dropdown-button">
        <span>Subscribed</span>
        {isDropdownOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
      </a>
      {isDropdownOpen ? (
        <DropdownMenu
          closeMenu={handleToggleSubscription}
          className="channel-follow-dropdown"
        >
          <li>
            <a onClick={handleToggleSubscription}>Unfollow channel</a>
          </li>
        </DropdownMenu>
      ) : null}
    </React.Fragment>
  ) : (
    <button className="follow-button" onClick={handleToggleSubscription}>
      Follow
    </button>
  )
}

export { SearchSubscriptionToggle }
