import React from "react"
import { render, screen } from "@testing-library/react"
import UserListCardTemplate from "./UserListCardTemplate"
import * as factories from "api/test-utils/factories"
import { makeImgConfig } from "ol-utilities/test-utils/factories"

const userListFactory = factories.userLists

describe("UserListCard", () => {
  it("renders title and cover image", () => {
    const userList = userListFactory.userList()
    const imgConfig = makeImgConfig()
    render(
      <UserListCardTemplate
        variant="column"
        userList={userList}
        imgConfig={imgConfig}
      />,
    )
    const heading = screen.getByRole("heading", { name: userList.title })
    expect(heading).toHaveAccessibleName(userList.title)
  })
})
