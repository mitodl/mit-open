import { renderTestApp, screen } from "../../test-utils"
import { channels as factory } from "api/test-utils/factories"
import { setMockResponse, urls as apiUrls, factories } from "api/test-utils"
import { makeChannelEditPath } from "@/common/urls"

describe("EditChannelPage", () => {
  const setup = () => {
    const channel = factory.channel({ is_moderator: true })
    setMockResponse.get(
      apiUrls.channels.details(channel.channel_type, channel.name),
      channel,
    )
    setMockResponse.get(
      apiUrls.learningResources.featured({ limit: 12 }),
      factories.learningResources.resources({ count: 0 }),
    )
    setMockResponse.get(
      apiUrls.userSubscription.check({
        source_type: "channel_subscription_type",
      }),
      factories.percolateQueries,
    )

    return channel
  }

  it("Displays 2 tabs for moderators", async () => {
    const channel = setup()
    setMockResponse.get(apiUrls.userMe.get(), {})
    renderTestApp({
      url: `${makeChannelEditPath(channel.channel_type, channel.name)}/`,
    })
    const tabs = screen.queryAllByRole("tab")
    expect(tabs.length).toEqual(0)
  })

  it("Displays message and no tabs for non-moderators", async () => {
    const channel = factory.channel({ is_moderator: false })
    setMockResponse.get(apiUrls.userMe.get(), {})
    setMockResponse.get(
      apiUrls.learningResources.featured({ limit: 12 }),
      factories.learningResources.resources({ count: 0 }),
    )
    setMockResponse.get(
      apiUrls.userSubscription.check({
        source_type: "channel_subscription_type",
      }),
      factories.percolateQueries,
    )
    setMockResponse.get(
      apiUrls.channels.details(channel.channel_type, channel.name),
      channel,
    )
    renderTestApp({
      url: `${makeChannelEditPath(channel.channel_type, channel.name)}/`,
    })
    await screen.findByText("You do not have permission to access this page.")
    const tabs = screen.queryAllByRole("tab")
    expect(tabs.length).toEqual(0)
  })

  it("Displays the correct tab and form for the #appearance hash", async () => {
    const channel = setup()
    setMockResponse.get(apiUrls.userMe.get(), {})
    renderTestApp({
      url: `${makeChannelEditPath(channel.channel_type, channel.name)}/#appearance`,
    })
    await screen.findByLabelText("Description")
    await screen.findByLabelText("Appearance")
  })
})
