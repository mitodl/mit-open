import React from "react"
import { faker } from "@faker-js/faker/locale/en"
import { factories, urls } from "api/test-utils"
import {
  screen,
  renderWithProviders,
  setMockResponse,
  user,
  expectProps,
  waitFor,
} from "../../test-utils"
import type { User } from "../../types/settings"
import UserListListingPage from "./UserListListingPage"
import UserListCardTemplate from "@/page-components/UserListCardTemplate/UserListCardTemplate"
import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"

jest.mock(
  "../../page-components/UserListCardTemplate/UserListCardTemplate",
  () => {
    const actual = jest.requireActual(
      "../../page-components/UserListCardTemplate/UserListCardTemplate",
    )
    return {
      __esModule: true,
      ...actual,
      default: jest.fn(actual.default),
    }
  },
)
const spyULCardTemplate = jest.mocked(UserListCardTemplate)

/**
 * Set up the mock API responses for lists pages.
 */
const setup = ({
  listsCount = faker.datatype.number({ min: 2, max: 5 }),
  user = { is_learning_path_editor: false },
}: {
  user?: Partial<User>
  listsCount?: number
} = {}) => {
  const paths = factories.userLists.userLists({ count: listsCount })

  setMockResponse.get(urls.userLists.list(), paths)

  setMockResponse.get(urls.userSubscription.list(), factories.percolateQueries)

  const { location } = renderWithProviders(<UserListListingPage />, {
    user,
  })

  return { paths, location }
}

describe("UserListListingPage", () => {
  it("Has title 'User Lists'", async () => {
    setup()
    screen.getByRole("heading", { name: "User Lists" })
    await waitFor(() => expect(document.title).toBe("User Lists"))
  })

  it("Renders a card for each user list", async () => {
    const { paths } = setup()
    const titles = paths.results.map((userList) => userList.title)
    const headings = await screen.findAllByRole("heading", {
      name: (value) => titles.includes(value),
    })

    // for sanity
    expect(headings.length).toBeGreaterThan(0)
    expect(titles.length).toBe(headings.length)

    paths.results.forEach((userList) => {
      expectProps(spyULCardTemplate, { userList: userList })
    })
  })

  test("Clicking edit -> Edit on opens the editing dialog", async () => {
    const editList = jest
      .spyOn(manageListDialogs, "upsertUserList")
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
      .spyOn(manageListDialogs, "destroyUserList")
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
      .spyOn(manageListDialogs, "upsertUserList")
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
        pathname: `/userlists/${path.id}`,
        search: "",
        hash: "",
      }),
    )
  })
})
