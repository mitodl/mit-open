import React from "react"
import { renderWithProviders } from "@/test-utils"
import SearchPage from "./SearchPage"
import { setMockResponse, urls } from "api/test-utils"

describe("SearchPage", () => {
  const setup = () => {
    const url = expect.stringContaining(urls.search.resources())
    setMockResponse.get(url, {})
    renderWithProviders(<SearchPage />)
  }

  test("Renders search results", () => {})

  test("Tabs show result counts", () => {})

  test("Page controls navigate through results", () => {})
})
