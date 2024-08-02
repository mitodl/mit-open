import React from "react"
import { faker } from "@faker-js/faker/locale/en"
import { factories, urls } from "api/test-utils"
import {
  screen,
  renderWithProviders,
  setMockResponse,
  user,
} from "../../test-utils"
import type { User } from "../../test-utils"

import { UserListListingComponent } from "./UserListListingComponent"
import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"

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
  it("Has heading 'User Lists' and correct page title", async () => {
    setup()
    screen.getByRole("heading", { name: "My Lists" })
  })

  it("Renders a card for each user list", async () => {
    const { paths } = setup()
    const titles = paths.results.map((userList) => userList.title)
    const headings = []
    for (const title of titles) {
      headings.push(await screen.findByText(title))
    }

    // for sanity
    expect(headings.length).toBeGreaterThan(0)
    expect(titles.length).toBe(headings.length)
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
})
