import { renderTestApp, screen } from "../../test-utils"
import { fields as factory } from "api/test-utils/factories"
import { setMockResponse, urls as apiUrls } from "api/test-utils"
import { makeFieldEditPath } from "@/common/urls"

describe("EditFieldPage", () => {
  const setup = () => {
    const field = factory.field({ is_moderator: true })
    setMockResponse.get(
      apiUrls.channels.detailsByType(field.channel_type, field.name),
      field,
    )
    return field
  }

  it("Displays 2 tabs for moderators", async () => {
    const field = setup()
    renderTestApp({ url: `${makeFieldEditPath(field.id.toString())}/` })
    const tabs = screen.queryAllByRole("tab")
    expect(tabs.length).toEqual(0)
  })

  it("Displays message and no tabs for non-moderators", async () => {
    const field = factory.field({ is_moderator: false })
    setMockResponse.get(
      apiUrls.channels.detailsByType(field.channel_type, field.name),
      field,
    )
    renderTestApp({ url: `${makeFieldEditPath(field.id.toString())}/` })
    await screen.findByText("You do not have permission to access this page.")
    const tabs = screen.queryAllByRole("tab")
    expect(tabs.length).toEqual(0)
  })

  it("Displays the correct tab and form for the #appearance hash", async () => {
    const field = setup()
    renderTestApp({
      url: `${makeFieldEditPath(field.id.toString())}/#appearance`,
    })
    await screen.findByLabelText("Description")
    await screen.findByLabelText("Appearance")
  })
})
