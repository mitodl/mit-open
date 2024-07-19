import React from "react"
import { renderWithProviders, screen } from "@/test-utils"
import { NotificationPreferenceForm } from "./NotificationPreferenceForm"
import { NOTIFICATION_PREFERENCE_CHOICES } from "@/common/profile"

describe("NotificationPreferenceForm", () => {
  it("Lists preference choices", async () => {
    renderWithProviders(<NotificationPreferenceForm />)
    for (const val of NOTIFICATION_PREFERENCE_CHOICES) {
      console.log("- - - - ", val)
      const notificationPref = screen.getByText(val.label)
      expect(notificationPref).toBeInTheDocument()
    }
  })
})
