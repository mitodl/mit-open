import React from "react"
import { screen, setMockResponse, renderWithProviders } from "@/test-utils"
import { urls } from "api/test-utils"
import { Permissions } from "@/common/permissions"
import TermsPage from "./TermsPage"

describe("TermsPage", () => {
  test("Renders title", async () => {
    setMockResponse.get(urls.userMe.get(), {
      [Permissions.Authenticated]: true,
    })

    renderWithProviders(<TermsPage />)
    screen.getByRole("heading", {
      name: "Terms of Service",
    })
  })
})
