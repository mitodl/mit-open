import React from "react"
import { faker } from "@faker-js/faker/locale/en"
import { factories, urls } from "api/test-utils"
import {
  screen,
  renderWithProviders,
  setMockResponse,
  expectProps,
  waitFor,
} from "../../test-utils"
import type { User } from "../../types/settings"
import UserListListingPage from "./UserListListingPage"
import UserListCardTemplate from "@/page-components/UserListCardTemplate/UserListCardTemplate"

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
})
