import React from "react"
import { faker } from "@faker-js/faker/locale/en"

import HomePage from "./Home"

import { urls, setMockResponse } from "api/test-utils"
import { learningResources as factory } from "api/test-utils/factories"
import { renderWithProviders, screen } from "../test-utils"

describe("HomePage", () => {
  it("Shows a list of courses", async () => {
    const count = faker.datatype.number({ min: 2, max: 4 })
    const resources = factory.resources({ count })
    setMockResponse.get(urls.learningResources.list(), resources)
    renderWithProviders(<HomePage />)
    const items = await screen.findAllByRole("listitem")
    expect(items.map(e => e.textContent)).toEqual(
      resources.results.map(r => r.title)
    )
  })
})
