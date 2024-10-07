import React from "react"
import { renderWithProviders, setMockResponse } from "@/test-utils"
import { urls } from "api/test-utils"
import * as commonUrls from "@/common/urls"
import { ForbiddenError, Permissions } from "@/common/permissions"
import { useFeatureFlagEnabled } from "posthog-js/react"
import CartPage from "./CartPage"
import { allowConsoleErrors } from "ol-test-utilities"

jest.mock("posthog-js/react")
const mockedUseFeatureFlagEnabled = jest.mocked(useFeatureFlagEnabled)

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
      mockedUseFeatureFlagEnabled.mockReturnValue(testCase === "on")

      if (testCase === "off") {
        allowConsoleErrors()
        expect(() =>
          renderWithProviders(<CartPage />, {
            url: commonUrls.ECOMMERCE_CART,
          }),
        ).toThrow(ForbiddenError)
      } else {
        renderWithProviders(<CartPage />, {
          url: commonUrls.ECOMMERCE_CART,
        })
      }
    })
  })
})
