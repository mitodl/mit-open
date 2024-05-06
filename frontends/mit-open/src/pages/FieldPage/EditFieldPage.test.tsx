import { renderTestApp, screen } from "../../test-utils"
import { fields as factory } from "api/test-utils/factories"
import { setMockResponse, urls as apiUrls, factories } from "api/test-utils"
import { makeFieldEditPath } from "@/common/urls"

describe("EditFieldPage", () => {
  const setup = () => {
    const field = factory.field({ is_moderator: true })
    setMockResponse.get(
      apiUrls.fields.details(field.channel_type, field.name),
      field,
    )
    setMockResponse.get(
      apiUrls.userSubscription.list(),
      factories.percolateQueries,
    )

    return field
  }

  it("Displays 2 tabs for moderators", async () => {
    const field = setup()
    setMockResponse.get(apiUrls.userMe.get(), {})
    renderTestApp({
      url: `${makeFieldEditPath(field.channel_type, field.name)}/`,
    })
    const tabs = screen.queryAllByRole("tab")
    expect(tabs.length).toEqual(0)
  })

  it("Displays message and no tabs for non-moderators", async () => {
    const field = factory.field({ is_moderator: false })
    setMockResponse.get(apiUrls.userMe.get(), {})
    setMockResponse.get(
      apiUrls.userSubscription.list(),
      factories.percolateQueries,
    )
    setMockResponse.get(
      apiUrls.fields.details(field.channel_type, field.name),
      field,
    )
    renderTestApp({
      url: `${makeFieldEditPath(field.channel_type, field.name)}/`,
    })
    await screen.findByText("You do not have permission to access this page.")
    const tabs = screen.queryAllByRole("tab")
    expect(tabs.length).toEqual(0)
  })

  it("Displays the correct tab and form for the #appearance hash", async () => {
    const field = setup()
    setMockResponse.get(apiUrls.userMe.get(), {})
    renderTestApp({
      url: `${makeFieldEditPath(field.channel_type, field.name)}/#appearance`,
    })
    await screen.findByLabelText("Description")
    await screen.findByLabelText("Appearance")
  })
})
