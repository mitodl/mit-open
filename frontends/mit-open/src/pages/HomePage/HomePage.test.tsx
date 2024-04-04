import React from "react"

import HomePage from "./HomePage"

import { urls, setMockResponse } from "api/test-utils"
import { learningResources as factory } from "api/test-utils/factories"
import { renderWithProviders, screen, user } from "../../test-utils"

describe("HomePage", () => {
  const setup = () => {
    // upcoming resources carousel
    const upcoming = factory.resources({ count: 4 })
    setMockResponse.get(
      expect.stringContaining(urls.learningResources.upcoming()),
      upcoming,
    )
    // media carousel
    const media = factory.resources({ count: 4 })
    setMockResponse.get(
      expect.stringContaining(urls.learningResources.list()),
      media,
    )
    return renderWithProviders(<HomePage />)
  }

  test("Submitting search goes to search page", async () => {
    const { location } = setup()
    const searchbox = screen.getByRole("textbox", { name: /search for/i })
    await user.click(searchbox)
    await user.paste("physics")
    await user.type(searchbox, "[Enter]")
    expect(location.current).toEqual(
      expect.objectContaining({
        pathname: "/search",
        search: "?q=physics",
      }),
    )
  })
})
