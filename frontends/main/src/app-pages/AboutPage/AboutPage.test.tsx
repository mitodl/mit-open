import React from "react"
import { screen, renderWithProviders } from "@/test-utils"
import { AboutPage } from "./AboutPage"

describe("AboutPage", () => {
  test("Renders title", async () => {
    renderWithProviders(<AboutPage />)
    screen.getByRole("heading", {
      name: "About Us",
    })
  })
})
