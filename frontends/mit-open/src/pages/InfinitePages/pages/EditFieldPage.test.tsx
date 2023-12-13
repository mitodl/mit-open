import { renderTestApp, screen, setMockResponse } from "../../../test-utils"
import * as factory from "services/api/fields/test-utils/factories"
import { FieldChannel, urls } from "services/api/fields"
import { urls as lrUrls } from "services/api/learning-resources"

describe("EditFieldPage", () => {
  const setup = (overrides?: Partial<FieldChannel>) => {
    const field = factory.makeField({ is_moderator: true, ...overrides })
    setMockResponse.get(urls.fieldDetails(field.name), field)
    setMockResponse.get(lrUrls.userList.listing({ public: true }), [field])
    return field
  }

  it("Displays 3 tabs for moderators", async () => {
    const field = setup()
    renderTestApp({ url: `/infinite${urls.fieldDetails(field.name)}manage/` })
    const tabs = await screen.findAllByRole("tab")
    expect(tabs.length).toEqual(3)
  })

  it("Displays message and no tabs for non-moderators", async () => {
    const field = setup({ is_moderator: false })
    setMockResponse.get(urls.fieldDetails(field.name), field)
    renderTestApp({ url: `/infinite${urls.fieldDetails(field.name)}manage/` })
    await screen.findByText("You do not have permission to access this page.")
    const tabs = screen.queryAllByRole("tab")
    expect(tabs.length).toEqual(0)
  })

  it("Displays the correct tab and form for the #appearance hash", async () => {
    const field = setup()
    renderTestApp({
      url: `/infinite${urls.fieldDetails(field.name)}manage/#appearance`,
    })
    const activeTab = await screen.findByRole("tab", { selected: true })
    expect(activeTab?.textContent).toEqual("Appearance")
    await screen.findByLabelText("Description")
  })

  it("Displays the correct tab and form for the #basic hash", async () => {
    const field = setup()
    renderTestApp({
      url: `/infinite${urls.fieldDetails(field.name)}manage/#basic`,
    })
    const activeTab = await screen.findByRole("tab", { selected: true })
    expect(activeTab?.textContent).toEqual("Basic")
    await screen.findByLabelText("Featured learning resources")
  })
})
