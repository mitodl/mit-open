import React from "react"
import { screen } from "@testing-library/react"
import { UserListCardCondensed } from "./UserListCardCondensed"
import * as factories from "api/test-utils/factories"
import { userListView } from "@/common/urls"
import { renderWithProviders } from "@/test-utils"

const userListFactory = factories.userLists

describe("UserListCard", () => {
  it("renders title and cover image", () => {
    const userList = userListFactory.userList()
    renderWithProviders(
      <UserListCardCondensed
        href={userListView(userList.id)}
        userList={userList}
      />,
    )
    const heading = screen.getByRole("heading", { name: userList.title })
    expect(heading).toHaveAccessibleName(userList.title)
  })
})
