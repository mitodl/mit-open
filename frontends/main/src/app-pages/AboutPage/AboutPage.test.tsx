import { renderTestApp, screen, waitFor, setMockResponse } from "@/test-utils"
import { urls } from "api/test-utils"
import * as commonUrls from "@/common/urls"
import { Permissions } from "@/common/permissions"

describe("AboutPage", () => {
  test.skip("Renders title", async () => {
    setMockResponse.get(urls.userMe.get(), {
      [Permissions.Authenticated]: true,
    })

    renderTestApp({
      url: commonUrls.ABOUT,
    })
    await waitFor(() => {
      expect(document.title).toBe("About Us | MIT Learn")
    })
    screen.getByRole("heading", {
      name: "About Us",
    })
  })
})
