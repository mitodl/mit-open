import {
  renderTestApp,
  screen,
  waitFor,
  setMockResponse,
} from "../../test-utils"
import { urls } from "api/test-utils"
import { Permissions } from "@/common/permissions"

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
    screen.getAllByRole("heading", {
      name: "Your MIT Learning Journey",
    })
  })
})
