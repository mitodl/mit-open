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

describe("LearningResourceDrawer", () => {
  it("Renders drawer content when resource=id is in the URL", async () => {
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
  })

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
