import React from "react"
import { faker } from "@faker-js/faker/locale/en"
import { factories, urls } from "api/test-utils"
import { ResourceTypeEnum as ResourceType } from "api"
import { manageListDialogs } from "./ManageListDialogs"
import LearningPathListingPage from "./LearningPathListingPage"
import { LearningResourceCardTemplate } from "ol-learning-resources"
import {
  screen,
  renderWithProviders,
  setMockResponse,
  user,
  expectProps,
  waitFor
} from "../../test-utils"

jest.mock("ol-learning-resources", () => {
  const actual = jest.requireActual("ol-learning-resources")
  return {
    ...actual,
    LearningResourceCardTemplate: jest.fn(actual.LearningResourceCardTemplate)
  }
})
const spyLRCardTemplate = jest.mocked(LearningResourceCardTemplate)

/**
 * Set up the mock API responses for lists pages.
 */
const setup = ({
  listsCount = faker.datatype.number({ min: 2, max: 5 })
} = {}) => {
  const paths = factories.learningResources.learningPaths({ count: listsCount })

  setMockResponse.get(
    urls.learningResources.list({ resource_type: ResourceType.LearningPath }),
    paths
  )

  const { history } = renderWithProviders(<LearningPathListingPage />)

  return { paths, history }
}

describe("LearningPathListingPage", () => {
  it("Has title 'Learning Paths'", async () => {
    setup()
    screen.getByRole("heading", { name: "Learning Paths" })
    await waitFor(() => expect(document.title).toBe("Learning Paths"))
  })

  it("Renders a card for each learning path", async () => {
    const { paths } = setup()
    const titles = paths.results.map(resource => resource.title)
    const headings = await screen.findAllByRole("heading", {
      name: value => titles.includes(value)
    })

    // for sanity
    expect(headings.length).toBeGreaterThan(0)
    expect(titles.length).toBe(headings.length)

    paths.results.forEach(resource => {
      expectProps(spyLRCardTemplate, { resource })
    })
  })

  test("Clicking edit -> Edit on opens the editing dialog", async () => {
    const editList = jest
      .spyOn(manageListDialogs, "upsert")
      .mockImplementationOnce(jest.fn())

    const { paths } = setup()
    const path = faker.helpers.arrayElement(paths.results)

    const menuButton = await screen.findByRole("button", {
      name: `Edit list ${path.title}`
    })
    await user.click(menuButton)
    const editButton = screen.getByRole("menuitem", { name: "Edit" })
    await user.click(editButton)

    expect(editList).toHaveBeenCalledWith(path)
  })

  test("$pageName: Clicking edit -> Delete opens the deletion dialog", async () => {
    const deleteList = jest
      .spyOn(manageListDialogs, "destroy")
      .mockImplementationOnce(jest.fn())

    const { paths } = setup()
    const path = faker.helpers.arrayElement(paths.results)

    const menuButton = await screen.findByRole("button", {
      name: `Edit list ${path.title}`
    })
    await user.click(menuButton)
    const deleteButton = screen.getByRole("menuitem", { name: "Delete" })

    await user.click(deleteButton)

    // Check details of this dialog elsewhere
    expect(deleteList).toHaveBeenCalledWith(path)
  })

  test("Clicking new list opens the creation dialog", async () => {
    const createList = jest
      .spyOn(manageListDialogs, "upsert")
      .mockImplementationOnce(jest.fn())
    setup()
    const newListButton = await screen.findByRole("button", {
      name: "Create new list"
    })

    expect(createList).not.toHaveBeenCalled()
    await user.click(newListButton)

    // Check details of this dialog elsewhere
    expect(createList).toHaveBeenCalledWith()
  })

  test("Clicking on list title navigates to list page", async () => {
    const { history, paths } = setup()
    const path = faker.helpers.arrayElement(paths.results)
    const listTitle = await screen.findByRole("heading", { name: path.title })
    await user.click(listTitle)
    expect(history.location).toEqual(
      expect.objectContaining({
        pathname: `/learningpaths/${path.id}`,
        search:   "",
        hash:     ""
      })
    )
  })
})
