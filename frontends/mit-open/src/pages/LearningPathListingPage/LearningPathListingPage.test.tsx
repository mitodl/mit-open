import React from "react"
import { faker } from "@faker-js/faker/locale/en"
import { factories, urls } from "api/test-utils"
import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"
import LearningPathListingPage from "./LearningPathListingPage"
import {
  screen,
  renderWithProviders,
  setMockResponse,
  user,
  waitFor,
} from "../../test-utils"
import type { User } from "../../test-utils"

/**
 * Set up the mock API responses for lists pages.
 */
const setup = ({
  listsCount = faker.number.int({ min: 2, max: 5 }),
  user = { is_learning_path_editor: true },
}: {
  user?: Partial<User>
  listsCount?: number
} = {}) => {
  const paths = factories.learningResources.learningPaths({ count: listsCount })

  setMockResponse.get(urls.learningPaths.list(), paths)

  const { location } = renderWithProviders(<LearningPathListingPage />, {
    user,
  })

  return { paths, location }
}

describe("LearningPathListingPage", () => {
  it("Has title 'Learning Paths'", async () => {
    setup()
    screen.getByRole("heading", { name: "Learning Paths" })
    await waitFor(() =>
      expect(document.title).toBe("Learning Paths | MIT Open"),
    )
  })

  it("Renders a card for each learning path", async () => {
    const { paths } = setup()
    const titles = paths.results.map((resource) => resource.title)
    const headings = await screen.findAllByRole("heading", {
      name: (value) => titles.includes(value),
    })

    // for sanity
    expect(headings.length).toBeGreaterThan(0)
    expect(titles.length).toBe(headings.length)
  })

  it.each([
    { user: { is_learning_path_editor: true }, canEdit: true },
    { user: { is_learning_path_editor: false }, canEdit: false },
  ])(
    "Only shows editting buttons for users with permission",
    async ({ canEdit, user }) => {
      const { paths } = setup({ user })
      const newListButton = screen.queryByRole("button", {
        name: "Create new list",
      })

      // Ensure the lists have loaded
      const path = paths.results[0]
      await screen.findAllByRole("heading", {
        name: path.title,
      })
      const menuButton = screen.queryByRole("button", {
        name: `Edit list ${path.title}`,
      })

      expect(!!newListButton).toBe(canEdit)
      expect(!!menuButton).toBe(canEdit)
    },
  )

  test("Clicking edit -> Edit on opens the editing dialog", async () => {
    const editList = jest
      .spyOn(manageListDialogs, "upsertLearningPath")
      .mockImplementationOnce(jest.fn())

    const { paths } = setup()
    const path = faker.helpers.arrayElement(paths.results)

    const menuButton = await screen.findByRole("button", {
      name: `Edit list ${path.title}`,
    })
    await user.click(menuButton)
    const editButton = screen.getByRole("menuitem", { name: "Edit" })
    await user.click(editButton)

    expect(editList).toHaveBeenCalledWith(path)
  })

  test("Clicking edit -> Delete opens the deletion dialog", async () => {
    const deleteList = jest
      .spyOn(manageListDialogs, "destroyLearningPath")
      .mockImplementationOnce(jest.fn())

    const { paths } = setup()
    const path = faker.helpers.arrayElement(paths.results)

    const menuButton = await screen.findByRole("button", {
      name: `Edit list ${path.title}`,
    })
    await user.click(menuButton)
    const deleteButton = screen.getByRole("menuitem", { name: "Delete" })

    await user.click(deleteButton)

    // Check details of this dialog elsewhere
    expect(deleteList).toHaveBeenCalledWith(path)
  })

  test("Clicking new list opens the creation dialog", async () => {
    const createList = jest
      .spyOn(manageListDialogs, "upsertLearningPath")
      .mockImplementationOnce(jest.fn())
    setup()
    const newListButton = await screen.findByRole("button", {
      name: "Create new list",
    })

    expect(createList).not.toHaveBeenCalled()
    await user.click(newListButton)

    // Check details of this dialog elsewhere
    expect(createList).toHaveBeenCalledWith()
  })

  test("Clicking on list title navigates to list page", async () => {
    const { location, paths } = setup()
    const path = faker.helpers.arrayElement(paths.results)
    const listTitle = await screen.findByRole("heading", { name: path.title })
    await user.click(listTitle)
    expect(location.current).toEqual(
      expect.objectContaining({
        pathname: `/learningpaths/${path.id}`,
        search: "",
        hash: "",
      }),
    )
  })
})
