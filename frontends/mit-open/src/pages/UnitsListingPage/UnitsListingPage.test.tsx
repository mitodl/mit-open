import React from "react"
import { renderWithProviders, screen, waitFor } from "@/test-utils"
import type { LearningResourceSearchResponse } from "api"
import UnitsListingPage from "./UnitsListingPage"
import { factories, setMockResponse, urls } from "api/test-utils"

const makeSearchResponse = (
  aggregations: Record<string, number>,
): LearningResourceSearchResponse => {
  return {
    metadata: {
      suggestions: [],
      aggregations: {
        topic: Object.entries(aggregations).map(([key, docCount]) => ({
          key,
          doc_count: docCount,
        })),
      },
    },
    count: 0,
    results: [],
    next: null,
    previous: null,
  }
}

describe("DepartmentListingPage", () => {
  const setupApis = () => {
    const make = factories.learningResources
    const academicUnit1 = make.offeror({
      code: "academicUnit1",
      professional: false,
    })
    const academicUnit2 = make.offeror({
      code: "academicUnit2",
      professional: false,
    })
    const academicUnit3 = make.offeror({
      code: "academicUnit3",
      professional: false,
    })

    const professionalUnit1 = make.offeror({
      code: "professionalUnit1",
      professional: true,
    })
    const professionalUnit2 = make.offeror({
      code: "professionalUnit2",
      professional: true,
    })
    const professionalUnit3 = make.offeror({
      code: "professionalUnit3",
      professional: true,
    })

    const units = [
      academicUnit1,
      academicUnit2,
      academicUnit3,
      professionalUnit1,
      professionalUnit2,
      professionalUnit3,
    ]
    const courseCounts = {
      academicUnit1: 10,
      academicUnit2: 20,
      academicUnit3: 1,
      professionalUnit1: 40,
      professionalUnit2: 50,
      professionalUnit3: 60,
    }
    const programCounts = {
      academicUnit1: 1,
      academicUnit2: 2,
      academicUnit3: 0,
      professionalUnit1: 4,
      professionalUnit2: 5,
      professionalUnit3: 6,
    }

    setMockResponse.get(urls.offerors.list(), units)
    setMockResponse.get(
      urls.search.resources({
        resource_type: ["course"],
        aggregations: ["offered_by"],
      }),
      makeSearchResponse(courseCounts),
    )
    setMockResponse.get(
      urls.search.resources({
        resource_type: ["program"],
        aggregations: ["offered_by"],
      }),
      makeSearchResponse(programCounts),
    )

    return {
      units,
    }
  }

  it("Has a page title", async () => {
    setupApis()
    renderWithProviders(<UnitsListingPage />)
    await waitFor(() => {
      expect(document.title).toBe("MIT Open | Units")
    })
    screen.getByRole("heading", { name: "Academic & Professional Learning" })
  })
})
