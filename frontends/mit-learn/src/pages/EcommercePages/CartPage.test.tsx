import {
  renderTestApp,
  screen,
  waitFor,
  setMockResponse,
} from "../../test-utils"
import { urls } from "api/test-utils"
import * as commonUrls from "@/common/urls"
import { Permissions } from "@/common/permissions"

describe("CartPage", () => {
  test("Renders title", async () => {
    setMockResponse.get(urls.userMe.get(), {
      [Permissions.Authenticated]: true,
    })

    renderTestApp({
      url: commonUrls.PRIVACY,
    })
    await waitFor(() => {
      expect(document.title).toBe("Shopping Cart | MIT Learn")
    })
    screen.getByRole("heading", {
      name: "Shopping Cart",
    })
  })
})
