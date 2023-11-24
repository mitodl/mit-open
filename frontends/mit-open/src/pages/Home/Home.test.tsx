import React from "react"

import HomePage from "./Home"

import { urls, setMockResponse } from "api/test-utils"
import { learningResources as factory } from "api/test-utils/factories"
import { renderWithProviders, screen, within } from "../../test-utils"
import invariant from "tiny-invariant"
import type { LearningResource } from "api"
import LearningResourceCard from "../../components/LearningResourceCard"

const spyLearningResourceCard = jest.mocked(LearningResourceCard)

const checkLRC = async (container: HTMLElement, resource: LearningResource) => {
  await within(container).findByText(resource.title)
  expect(spyLearningResourceCard).toHaveBeenCalledWith(
    expect.objectContaining({ resource }),
    expect.anything(),
  )
}

describe("HomePage", () => {
  it("Shows Upcoming Courses", async () => {
    const resources = factory.resources({ count: 4 })
    setMockResponse.get(urls.learningResources.list(), resources)
    renderWithProviders(<HomePage />)

    const title = await screen.findByRole("heading", {
      name: "Upcoming Courses",
    })

    const upcomingCoursesSection = title.closest("section")
    invariant(upcomingCoursesSection)

    const [course1, course2, course3, course4] = resources.results

    await checkLRC(upcomingCoursesSection, course1)
    await checkLRC(upcomingCoursesSection, course2)
    await checkLRC(upcomingCoursesSection, course3)
    await checkLRC(upcomingCoursesSection, course4)

    within(upcomingCoursesSection).getByRole("button", { name: "Previous" })
    within(upcomingCoursesSection).getByRole("button", { name: "Next" })
  })
})
