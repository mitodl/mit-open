import React from "react"
import { render, screen } from "@testing-library/react"
import { UserListCardCondensed } from "./UserListCardCondensed"
import * as factories from "api/test-utils/factories"
import { ThemeProvider } from "ol-components"

const userListFactory = factories.userLists

describe("UserListCard", () => {
  it("renders title and cover image", () => {
    const userList = userListFactory.userList()
    render(<UserListCardCondensed userList={userList} />, {
      wrapper: ThemeProvider,
    })
    const heading = screen.getByText(userList.title)
    expect(heading).toBeInTheDocument()
  })
})
