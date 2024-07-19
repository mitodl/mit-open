import React from "react"
import { renderWithProviders, screen, user, within } from "@/test-utils"
import { SearchSubscriptionToggle } from "./SearchSubscriptionToggle"
import { urls, setMockResponse, factories, makeRequest } from "api/test-utils"
import { SourceTypeEnum } from "api"
import type { LearningResourcesUserSubscriptionApiLearningResourcesUserSubscriptionCheckListRequest as CheckSubscriptionRequest } from "api"

type SetupApisOptions = {
  isAuthenticated?: boolean
  isSubscribed?: boolean
  subscriptionRequest?: CheckSubscriptionRequest
}
const setupApis = ({
  isAuthenticated = false,
  isSubscribed = false,
  subscriptionRequest = {},
}: SetupApisOptions = {}) => {
  setMockResponse.get(urls.userMe.get(), {
    is_authenticated: isAuthenticated,
  })

  const subscribeResponse = isSubscribed
    ? factories.percolateQueries.percolateQueryList({ count: 1 }).results
    : factories.percolateQueries.percolateQueryList({ count: 0 }).results
  setMockResponse.get(
    `${urls.userSubscription.check(subscriptionRequest)}`,
    subscribeResponse,
  )

  const subscribeUrl = urls.userSubscription.post()
  setMockResponse.post(subscribeUrl, subscribeResponse)

  const unsubscribeUrl = urls.userSubscription.delete(subscribeResponse[0]?.id)
  setMockResponse.delete(unsubscribeUrl, subscribeResponse[0])
  return {
    subscribeUrl,
    unsubscribeUrl,
  }
}

test("Shows subscription popover if user is NOT authenticated", async () => {
  // Don't set up all the APIs... We don't want to call the others for unauthenticated users.
  setMockResponse.get(urls.userMe.get(), {}, { code: 403 })
  renderWithProviders(
    <SearchSubscriptionToggle
      itemName="Test"
      searchParams={new URLSearchParams()}
      sourceType="channel_subscription_type"
    />,
  )
  const subscribeButton = await screen.findByRole("button", {
    name: "Follow",
  })
  await user.click(subscribeButton)
  const popover = await screen.findByRole("dialog")
  within(popover).getByRole("link", { name: "Sign Up" })
})

test.each(Object.values(SourceTypeEnum))(
  "Allows subscribing if authenticated and NOT subscribed (source_type=%s)",
  async (sourceType) => {
    const { subscribeUrl } = setupApis({
      isAuthenticated: true,
      isSubscribed: false,
      subscriptionRequest: {
        source_type: sourceType,
        offered_by: ["ocw"],
      },
    })
    renderWithProviders(
      <SearchSubscriptionToggle
        itemName="Test"
        searchParams={new URLSearchParams([["offered_by", "ocw"]])}
        sourceType={sourceType}
      />,
    )
    const subscribeButton = await screen.findByRole("button", {
      name: "Follow",
    })
    await user.click(subscribeButton)
    expect(makeRequest).toHaveBeenCalledWith("post", subscribeUrl, {
      source_type: sourceType,
      offered_by: ["ocw"],
    })
  },
)

test.each(Object.values(SourceTypeEnum))(
  "Allows unsubscribing if authenticated and subscribed (source_type=%s)",
  async (sourceType) => {
    const { unsubscribeUrl } = setupApis({
      isAuthenticated: true,
      isSubscribed: true,
      subscriptionRequest: {
        source_type: sourceType,
        offered_by: ["ocw"],
      },
    })

    renderWithProviders(
      <SearchSubscriptionToggle
        itemName="Test"
        searchParams={new URLSearchParams([["offered_by", "ocw"]])}
        sourceType={sourceType}
      />,
    )

    const subscribedButton = await screen.findByRole("button", {
      name: "Following",
    })

    await user.click(subscribedButton)

    const menu = screen.getByRole("menu")
    const unsubscribeButton = within(menu).getByRole("menuitem", {
      name: "Unfollow",
    })
    await user.click(unsubscribeButton)

    expect(makeRequest).toHaveBeenCalledWith(
      "delete",
      unsubscribeUrl,
      undefined,
    )
  },
)
