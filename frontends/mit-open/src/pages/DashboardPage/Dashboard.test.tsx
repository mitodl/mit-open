import {
  renderTestApp,
  screen,
  waitFor,
  setMockResponse,
  within,
} from "../../test-utils"
import { urls } from "api/test-utils"
import { Permissions } from "@/common/permissions"
import { DashboardTabLabels } from "./DashboardPage"

describe("DashboardPage", () => {
  test("Renders title", async () => {
    setMockResponse.get(urls.userMe.get(), {
      [Permissions.Authenticated]: true,
    })

    renderTestApp({
      url: "/dashboard",
    })
    await waitFor(() => {
      expect(document.title).toBe("User Home")
    })
    screen.getByRole("heading", {
      name: "Your MIT Learning Journey",
    })
  })

  test("Renders user info", async () => {
    setMockResponse.get(urls.userMe.get(), {
      [Permissions.Authenticated]: true,
      first_name: "User",
      last_name: "Info",
    })

    renderTestApp({
      url: "/dashboard",
    })
    await waitFor(() => {
      /**
       * There should be two instances of "User Info" text,
       * one in the header and one in the main content
       */
      const userInfoText = screen.getAllByText("User Info")
      expect(userInfoText).toHaveLength(2)
    })
  })

  test("Renders user menu tabs and panels", async () => {
    setMockResponse.get(urls.userMe.get(), {
      [Permissions.Authenticated]: true,
    })

    renderTestApp({
      url: "/dashboard",
    })
    const tabLists = await screen.findAllByRole("tablist")
    const desktopTabList = await screen.findByTestId("desktop-tab-list")
    const mobileTabList = await screen.findByTestId("mobile-tab-list")
    const desktopTabs = await within(desktopTabList).findAllByRole("tab")
    const mobileTabs = await within(mobileTabList).findAllByRole("tab")
    const tabPanels = await screen.findAllByRole("tabpanel", { hidden: true })
    // 1 for mobile, 1 for desktop
    expect(tabLists).toHaveLength(2)
    expect(mobileTabs).toHaveLength(3)
    expect(desktopTabs).toHaveLength(3)
    expect(tabPanels).toHaveLength(3)
    Object.values(DashboardTabLabels).forEach((label) => {
      const desktopLabel = within(desktopTabList).getByText(label)
      const mobileLabel = within(mobileTabList).getByText(label)
      expect(desktopLabel).toBeInTheDocument()
      expect(mobileLabel).toBeInTheDocument()
    })
  })

  test("Renders the expected tab links", async () => {
    setMockResponse.get(urls.userMe.get(), {
      [Permissions.Authenticated]: true,
    })

    renderTestApp({
      url: "/dashboard",
    })
    Object.keys(DashboardTabLabels).forEach(async (key) => {
      const desktopTab = await screen.findByTestId(`desktop-tab-${key}`)
      const mobileTab = await screen.findByTestId(`mobile-tab-${key}`)
      expect(desktopTab).toBeInTheDocument()
      expect(mobileTab).toBeInTheDocument()
      expect(desktopTab).toHaveAttribute("href", `/dashboard#${key}`)
      expect(mobileTab).toHaveAttribute("href", `/dashboard#${key}`)
    })
  })
})
