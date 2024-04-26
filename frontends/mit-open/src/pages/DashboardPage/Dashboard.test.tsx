import { renderTestApp, screen, waitFor } from "../../test-utils"

describe("DashboardPage", () => {
  test("Renders title", async () => {
    renderTestApp({
      url: "/dashboard",
      user: { is_authenticated: true },
    })
    await waitFor(() => {
      expect(document.title).toBe("Dashboard")
    })
    screen.getByRole("heading", {
      name: "Dashboard",
    })
  })
})
