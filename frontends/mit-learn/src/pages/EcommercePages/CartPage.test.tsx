import { renderTestApp, waitFor, setMockResponse } from "../../test-utils"
import { urls } from "api/test-utils"
import * as commonUrls from "@/common/urls"
import { Permissions } from "@/common/permissions"
import { login } from "@/common/urls"
import { useFeatureFlagEnabled } from "posthog-js/react"

jest.mock("posthog-js/react")
const mockedUseFatureFlagEnabled = jest.mocked(useFeatureFlagEnabled)

const oldWindowLocation = window.location

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).location

  window.location = Object.defineProperties({} as Location, {
    ...Object.getOwnPropertyDescriptors(oldWindowLocation),
    assign: {
      configurable: true,
      value: jest.fn(),
    },
  })
})

afterAll(() => {
  window.location = oldWindowLocation
})

describe("CartPage", () => {
  ;["on", "off"].forEach((testCase: string) => {
    test(`Renders when logged in and feature flag is ${testCase}`, async () => {
      setMockResponse.get(urls.userMe.get(), {
        [Permissions.Authenticated]: true,
      })
      mockedUseFatureFlagEnabled.mockReturnValue(testCase === "on")

      renderTestApp({
        url: commonUrls.ECOMMERCE_CART,
      })
      await waitFor(() => {
        testCase === "on"
          ? expect(document.title).toBe("Shopping Cart | MIT Learn")
          : expect(document.title).not.toBe("Shopping Cart | MIT Learn")
      })
    })
  })

  test("Sends to login page when logged out", async () => {
    setMockResponse.get(urls.userMe.get(), {
      [Permissions.Authenticated]: false,
    })
    const expectedUrl = login({
      pathname: "/cart/",
    })

    renderTestApp({
      url: commonUrls.ECOMMERCE_CART,
    })

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(expectedUrl)
    })
  })
})
