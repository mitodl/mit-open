import React from "react"

import { urls, setMockResponse } from "api/test-utils"
import { learningResources as factory } from "api/test-utils/factories"

import { renderTestApp, screen } from "./test-utils"

jest.mock("posthog-js/react", () => ({
  PostHogProvider: (props: { children: React.ReactNode }) => (
    <div data-testid="phProvider">{props.children}</div>
  ),
}))

describe("PostHogProvider", () => {
  it("Renders with PostHog support if enabled", async () => {
    window.SETTINGS = {
      ...window.SETTINGS,
      posthog: {
        api_key: "a string",
        enabled: true,
      },
    }

    const resources = factory.resources({ count: 4 })
    setMockResponse.get(urls.learningResources.list(), resources)

    renderTestApp()

    const phProvider = screen.getAllByTestId("phProvider")

    expect(phProvider.length).toBe(1)
  })

  it("Renders without PostHog support if disabled", async () => {
    window.SETTINGS = {
      ...window.SETTINGS,
      posthog: {
        api_key: "a string",
        enabled: false,
      },
    }

    const resources = factory.resources({ count: 4 })
    setMockResponse.get(urls.learningResources.list(), resources)

    renderTestApp()

    const phProvider = screen.queryAllByTestId("phProvider")

    expect(phProvider.length).toBe(0)
  })
})
