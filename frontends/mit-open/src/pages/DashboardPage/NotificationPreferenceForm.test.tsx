import React from "react"
import { renderWithProviders, screen } from "@/test-utils"
import { NotificationPreferenceForm } from "./NotificationPreferenceForm"
import { NOTIFICATION_PREFERENCE_CHOICES } from "@/common/profile"
import { factories } from "api/test-utils"
import { faker } from "@faker-js/faker/locale/en"
const setupAPIs = () => {
  const profile = factories.user.profile({
    preference_search_filters: {
      topic: factories.learningResources
        .topics({ count: 3 })
        .results.map((topic) => topic.name),
      certification: faker.helpers.arrayElement([true, false]),
      learning_format: faker.helpers.arrayElements([
        "online",
        "in-person",
        "hybrid",
      ]),
    },
  })
  return { profile }
}
describe("NotificationPreferenceForm", () => {
  const { profile } = setupAPIs()

  it("Lists preference choices", async () => {
    renderWithProviders(<NotificationPreferenceForm profile={profile} />)
    for (const val of NOTIFICATION_PREFERENCE_CHOICES) {
      console.log("- - - - ", val)
      const notificationPref = screen.getByText(val.label)
      expect(notificationPref).toBeInTheDocument()
    }
  })
})
