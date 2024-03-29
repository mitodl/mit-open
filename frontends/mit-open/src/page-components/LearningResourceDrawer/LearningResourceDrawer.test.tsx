import React from "react"
import { renderWithProviders } from "@/test-utils"
import LearningResourceDrawer from "./LearningResourceDrawer"

describe("LearningResourceDrawer", () => {
  it("Renders iff resource=resourceId is in the URL", () => {
    renderWithProviders(<LearningResourceDrawer />)

    // assert API not called
    // change the URL using useOpenLearningResourceDrawer
    // assert API called
    // simple check that contents are reasonable
  })
})
