import React from "react"

import { renderWithProviders, screen } from "./test-utils"

jest.mock("posthog-js/react", () => ({
  PostHogProvider: (props: { children: React.ReactNode }) => (
    <div data-testid="phProvider">{props.children}</div>
  ),
}))

describe("PostHogProvider", () => {
  it("Renders with PostHog support if enabled", async () => {
    APP_SETTINGS.posthog = {
      api_key: "", // pragma: allowlist secret
      enabled: true,
    }

    renderWithProviders(<div data-testid="some-children" />)

    const phProvider = screen.getAllByTestId("phProvider")

    expect(phProvider.length).toBe(1)
  })

  it("Renders without PostHog support if disabled", async () => {
    APP_SETTINGS.posthog = {
      api_key: "", // pragma: allowlist secret
      enabled: false,
    }

    renderWithProviders(<div data-testid="some-children" />)

    const phProvider = screen.queryAllByTestId("phProvider")

    expect(phProvider.length).toBe(0)
  })
})
