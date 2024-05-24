import {
  renderTestApp,
  screen,
  waitFor,
  setMockResponse,
} from "../../test-utils"
import { urls } from "api/test-utils"
import * as commonUrls from "@/common/urls"
import { Permissions } from "@/common/permissions"

describe("AccessibilityPage", () => {
  test("Renders title", async () => {
    setMockResponse.get(urls.userMe.get(), {
      [Permissions.Authenticated]: true,
    })

    renderTestApp({
      url: commonUrls.ACCESSIBILITY,
    })
    await waitFor(() => {
      expect(document.title).toBe("Accessibility")
    })
    screen.getByRole("heading", {
      name: "Accessibility",
    })
  })
})
