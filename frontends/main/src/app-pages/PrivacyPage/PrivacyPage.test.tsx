import React from "react"
import { screen, setMockResponse, renderWithProviders } from "@/test-utils"
import { urls } from "api/test-utils"
import { Permissions } from "@/common/permissions"
import PrivacyPage from "./PrivacyPage"

describe("PrivacyPage", () => {
  test("Renders title", async () => {
    setMockResponse.get(urls.userMe.get(), {
      [Permissions.Authenticated]: true,
    })

    renderWithProviders(<PrivacyPage />)

    screen.getByRole("heading", {
      name: "Privacy Policy",
    })
  })
})
