import {
  renderTestApp,
  screen,
  waitFor,
  setMockResponse,
} from "../../test-utils"
import { urls } from "api/test-utils"
import * as commonUrls from "@/common/urls"
import { Permissions } from "@/common/permissions"

describe("ContactPage", () => {
  test("Renders title", async () => {
    setMockResponse.get(urls.userMe.get(), {
      [Permissions.Authenticated]: true,
    })

    renderTestApp({
      url: commonUrls.CONTACT,
    })
    await waitFor(() => {
      expect(document.title).toBe("Contact Us")
    })
    screen.getByRole("heading", {
      name: "Contact Us",
    })
  })
})
