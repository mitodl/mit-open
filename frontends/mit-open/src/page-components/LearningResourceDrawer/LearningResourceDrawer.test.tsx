import React from "react"
import {
  act,
  expectProps,
  renderWithProviders,
  screen,
  waitFor,
} from "@/test-utils"
import LearningResourceDrawer, {
  useOpenLearningResourceDrawer,
} from "./LearningResourceDrawer"
import { urls, factories, setMockResponse } from "api/test-utils"
import { ExpandedLearningResourceDisplay } from "ol-components"
import { RESOURCE_DRAWER_QUERY_PARAM } from "@/common/urls"

jest.mock("ol-components", () => {
  const actual = jest.requireActual("ol-components")
  return {
    ...actual,
    ExpandedLearningResourceDisplay: jest.fn(
      actual.ExpandedLearningResourceDisplay,
    ),
  }
})

const mockedPostHogCapture = jest.fn()

jest.mock("posthog-js/react", () => ({
  PostHogProvider: (props: { children: React.ReactNode }) => (
    <div data-testid="phProvider">{props.children}</div>
  ),

  usePostHog: () => {
    return { capture: mockedPostHogCapture }
  },
}))

describe("LearningResourceDrawer", () => {
  it.each([
    ["is enabled", true],
    ["is not enabled", false],
  ])(
    "Renders drawer content when resource=id is in the URL and captures the view if PostHog $descriptor",
    async (descriptor, enablePostHog) => {
      APP_SETTINGS.posthog = {
        api_key: "test1234", // pragma: allowlist secret
      }
      const resource = factories.learningResources.resource()
      setMockResponse.get(
        urls.learningResources.details({ id: resource.id }),
        resource,
      )
      renderWithProviders(<LearningResourceDrawer />, {
        url: `?dog=woof&${RESOURCE_DRAWER_QUERY_PARAM}=${resource.id}`,
      })
      expect(ExpandedLearningResourceDisplay).toHaveBeenCalled()
      await waitFor(() => {
        expectProps(ExpandedLearningResourceDisplay, { resource })
      })
      await screen.findByRole("heading", { name: resource.title })
      if (enablePostHog) {
        expect(mockedPostHogCapture).toHaveBeenCalled()
      } else {
        expect(mockedPostHogCapture).not.toHaveBeenCalled()
      }
    },
  )

  it("Does not render drawer content when resource=id is NOT in the URL", async () => {
    renderWithProviders(<LearningResourceDrawer />, {
      url: "?dog=woof",
    })
    expect(ExpandedLearningResourceDisplay).not.toHaveBeenCalled()
  })

  test("useOpenLearningResourceDrawer sets correct parameter", () => {
    let openDrawer = (_id: number): void => {
      throw new Error("Not implemented")
    }
    const TestComponent = () => {
      openDrawer = useOpenLearningResourceDrawer()
      return null
    }
    const { location } = renderWithProviders(<TestComponent />, {
      url: "?dog=woof",
    })

    act(() => {
      openDrawer(123)
    })

    const params = new URLSearchParams(location.current.search)
    expect(Object.fromEntries(params)).toEqual({
      [RESOURCE_DRAWER_QUERY_PARAM]: "123",
      dog: "woof",
    })
  })
})
