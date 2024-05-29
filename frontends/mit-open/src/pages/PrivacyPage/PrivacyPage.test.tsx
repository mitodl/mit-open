import {
  renderTestApp,
  screen,
  waitFor,
  setMockResponse,
} from "../../test-utils"
import { urls } from "api/test-utils"
import * as commonUrls from "@/common/urls"
import { Permissions } from "@/common/permissions"

describe("PrivacyPage", () => {
  test("Renders title", async () => {
    setMockResponse.get(urls.userMe.get(), {
      [Permissions.Authenticated]: true,
    })

    renderTestApp({
      url: commonUrls.PRIVACY,
    })
    await waitFor(() => {
      expect(document.title).toBe("Privacy Policy")
    })
    screen.getByRole("heading", {
      name: "Privacy Policy",
    })
  })
})
