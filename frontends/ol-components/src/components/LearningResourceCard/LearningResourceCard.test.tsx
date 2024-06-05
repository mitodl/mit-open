import React from "react"
import { render, screen } from "@testing-library/react"
import { LearningResourceCard } from "./LearningResourceCard"
import { ResourceTypeEnum, PlatformEnum } from "api"
import { factories } from "api/test-utils"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"

describe("Learning Resource Card", () => {
  test("Renders resource type, title and start date", () => {
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Course,
      next_start_date: "2026-01-01",
    })

    render(<LearningResourceCard resource={resource} />)

    screen.getByText("Course")
    screen.getByRole("heading", { name: resource.title })
    screen.getByText("Starts:")
    screen.getByText("January 01, 2026")
  })

  test("Displays run start date", () => {
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Course,
      next_start_date: null,
      runs: [
        factories.learningResources.run({
          start_date: "2026-01-01",
        }),
      ],
    })

    render(<LearningResourceCard resource={resource} />)

    screen.getByText("Starts:")
    screen.getByText("January 01, 2026")
  })

  test("Displays taught in date for OCW", () => {
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Course,
      platform: { code: PlatformEnum.Ocw },
      runs: [
        factories.learningResources.run({
          semester: "Fall",
          year: 2002,
        }),
      ],
    })

    render(<LearningResourceCard resource={resource} />)

    screen.getByText("As taught in:")
    screen.getByText("Fall 2002")
  })

  test("Click to activate and action buttons", async () => {
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Course,
      platform: { code: PlatformEnum.Ocw },
      runs: [
        factories.learningResources.run({
          semester: "Fall",
          year: 2002,
        }),
      ],
    })

    const onActivate = jest.fn()
    const onAddToLearningPathClick = jest.fn()
    const onAddToUserListClick = jest.fn()

    render(
      <LearningResourceCard
        resource={resource}
        onActivate={onActivate}
        onAddToLearningPathClick={onAddToLearningPathClick}
        onAddToUserListClick={onAddToUserListClick}
      />,
      { wrapper: ThemeProvider },
    )

    const heading = screen.getByRole("heading", { name: resource.title })
    await heading.click()

    const addToLearningPathButton = screen.getByLabelText(
      "Add to Learning Path",
    )
    await addToLearningPathButton.click()

    const addToUserListButton = screen.getByLabelText("Add to User List")
    await addToUserListButton.click()

    expect(onActivate).toHaveBeenCalledWith(resource.id)
    expect(onAddToLearningPathClick).toHaveBeenCalledWith(resource.id)
    expect(onAddToUserListClick).toHaveBeenCalledWith(resource.id)
  })

  test("Displays certificate badge", () => {
    const resource = factories.learningResources.resource({
      certification: true,
    })

    render(<LearningResourceCard resource={resource} />)

    screen.getByText("Certificate")
  })

  test("Does not display certificate badge", () => {
    const resource = factories.learningResources.resource({
      certification: false,
    })

    render(<LearningResourceCard resource={resource} />)

    const badge = screen.queryByText("Certificate")

    expect(badge).not.toBeInTheDocument()
  })
})
