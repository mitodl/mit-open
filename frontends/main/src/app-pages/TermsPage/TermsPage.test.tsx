import { renderTestApp, screen, waitFor, setMockResponse } from "@/test-utils"
import { urls } from "api/test-utils"
import * as commonUrls from "@/common/urls"
import { Permissions } from "@/common/permissions"

describe("TermsPage", () => {
  test("Renders title", async () => {
    setMockResponse.get(urls.userMe.get(), {
      [Permissions.Authenticated]: true,
    })

    renderTestApp({
      url: commonUrls.TERMS,
    })
    await waitFor(() => {
      expect(document.title).toBe("Terms of Service | MIT Learn")
    })
    screen.getByRole("heading", {
      name: "Terms of Service",
    })
  })
})
