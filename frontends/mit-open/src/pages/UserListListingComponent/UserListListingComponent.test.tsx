import React from "react"
import { faker } from "@faker-js/faker/locale/en"
import { factories, urls } from "api/test-utils"
import {
  screen,
  renderWithProviders,
  setMockResponse,
  user,
  expectProps,
  within,
} from "../../test-utils"
import type { User } from "../../test-utils"

import UserListListingComponent from "./UserListListingComponent"
import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"
import UserListCardCondensed from "@/page-components/UserListCard/UserListCardCondensed"
import { userListView } from "@/common/urls"

jest.mock("../../page-components/UserListCard/UserListCardCondensed", () => {
  const actual = jest.requireActual(
    "../../page-components/UserListCard/UserListCardCondensed",
  )
  return {
    __esModule: true,
    ...actual,
    default: jest.fn(actual.default),
  }
})
const spyULCardCondensed = jest.mocked(UserListCardCondensed)

/**
 * Set up the mock API responses for lists pages.
 */
const setup = ({
  listsCount = faker.number.int({ min: 2, max: 5 }),
  user = { is_learning_path_editor: false },
}: {
  user?: Partial<User>
  listsCount?: number
} = {}) => {
  const paths = factories.userLists.userLists({ count: listsCount })
  setMockResponse.get(urls.userLists.list(), paths)

  setMockResponse.get(urls.userSubscription.check(), factories.percolateQueries)

  const { location } = renderWithProviders(
    <UserListListingComponent title="My Lists" />,
    {
      user,
    },
  )

  return { paths, location }
}

describe("UserListListingPage", () => {
  it("Has heading 'My Lists'", async () => {
    setup()
    screen.getByRole("heading", { name: "My Lists" })
  })

  it("Shows the empty view when there are no lists", async () => {
    setup({ listsCount: 0 })
    const emptyText = await screen.findByText(
      "Create lists to save your courses and materials.",
      { exact: false },
    )
    expect(emptyText).toBeInTheDocument()

    const createList = jest
      .spyOn(manageListDialogs, "upsertUserList")
      .mockImplementationOnce(jest.fn())

    const newButton = await screen.findByRole("button", {
      name: "Create new list",
    })

    await user.click(newButton)
    expect(createList).toHaveBeenCalled()
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
      expectProps(spyULCardCondensed, {
        href: userListView(userList.id),
        userList: userList,
      })
    })
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

  test("Clicking on the card shows the list detail view", async () => {
    const { paths, location } = setup()
    const card = await screen.findByTestId(
      `user-list-card-condensed-${paths.results[0].id}`,
    )
    const cardLink = within(card).getByRole("link")

    await user.click(cardLink)
    expect(location.current.pathname).toBe(userListView(paths.results[0].id))
  })
})
