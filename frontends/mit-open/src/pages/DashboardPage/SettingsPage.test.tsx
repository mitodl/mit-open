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
  const unsubscribeUrl = urls.userSubscription.delete(subscribeResponse[0]?.id)
  setMockResponse.delete(unsubscribeUrl, subscribeResponse[0])
  return {
    unsubscribeUrl,
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
    const { unsubscribeUrl } = setupApis({
      isAuthenticated: true,
      isSubscribed: true,
      subscriptionRequest: {},
    })
    renderWithProviders(<SettingsPage />)

    const followList = await screen.findByTestId("follow-list")
    const unsubscribeButton = within(followList).getAllByText("Unfollow")[0]
    await user.click(unsubscribeButton)

    expect(makeRequest).toHaveBeenCalledWith(
      "delete",
      unsubscribeUrl,
      undefined,
    )
  })
})
