import React from "react"
import { SettingsPage } from "./SettingsPage"
import { renderWithProviders, screen, within, user } from "@/test-utils"
import { urls, setMockResponse, factories, makeRequest } from "api/test-utils"
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
    ? factories.percolateQueries.percolateQueryList({ count: 5 }).results
    : factories.percolateQueries.percolateQueryList({ count: 0 }).results
  setMockResponse.get(
    `${urls.userSubscription.check(subscriptionRequest)}`,
    subscribeResponse,
  )
  const unsubscribeUrls = []
  for (const sub of subscribeResponse) {
    const unsubscribeUrl = urls.userSubscription.delete(sub?.id)
    unsubscribeUrls.push(unsubscribeUrl)
    setMockResponse.delete(unsubscribeUrl, sub)
  }

  return {
    unsubscribeUrls,
  }
}

describe("SettingsPage", () => {
  it("Renders user subscriptions in a list", async () => {
    setupApis({
      isAuthenticated: true,
      isSubscribed: true,
      subscriptionRequest: {},
    })
    renderWithProviders(<SettingsPage />)

    const followList = await screen.findByTestId("follow-list")
    expect(followList.children.length).toBe(5)
  })

  test("Clicking 'Unfollow' removes the subscription", async () => {
    const { unsubscribeUrls } = setupApis({
      isAuthenticated: true,
      isSubscribed: true,
      subscriptionRequest: {},
    })
    renderWithProviders(<SettingsPage />)

    const followList = await screen.findByTestId("follow-list")
    const unsubscribeLink = within(followList).getAllByText("Unfollow")[0]
    await user.click(unsubscribeLink)

    const unsubscribeButton = await screen.findByTestId("dialog-unfollow")
    await user.click(unsubscribeButton)
    expect(makeRequest).toHaveBeenCalledWith(
      "delete",
      unsubscribeUrls[0],
      undefined,
    )
  })

  test("Clicking 'Unfollow All' removes all subscriptions", async () => {
    const { unsubscribeUrls } = setupApis({
      isAuthenticated: true,
      isSubscribed: true,
      subscriptionRequest: {},
    })
    renderWithProviders(<SettingsPage />)
    const unsubscribeLink = await screen.findByTestId("unfollow-all")
    await user.click(unsubscribeLink)

    const unsubscribeButton = await screen.findByTestId("dialog-unfollow")
    await user.click(unsubscribeButton)
    for (const unsubUrl of unsubscribeUrls) {
      expect(makeRequest).toHaveBeenCalledWith("delete", unsubUrl, undefined)
    }
  })
  test("Unsubscribe from all is hidden if there are no subscriptions", async () => {
    setupApis({
      isAuthenticated: true,
      isSubscribed: false,
      subscriptionRequest: {},
    })
    renderWithProviders(<SettingsPage />)
    const unfollowButton = screen.queryByText("Unfollow All")
    expect(unfollowButton).not.toBeInTheDocument()
  })
})
