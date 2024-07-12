import React from "react"
import { setMockResponse, urls } from "api/test-utils"
import { renderWithProviders, screen, waitFor } from "@/test-utils"

import { testimonials as factory } from "api/test-utils/factories"
import TestimonialDisplay from "./TestimonialDisplay"

const setupAPIs = () => {
  setMockResponse.get(urls.userMe.get(), {})
}

describe("TestimonialDisplay", () => {
  test("Display the carousel if there's more than one testimonial", async () => {
    setupAPIs()

    const attestations = factory.testimonials({ count: 3 })

    setMockResponse.get(
      expect.stringContaining(urls.testimonials.list({})),
      attestations,
    )

    renderWithProviders(<TestimonialDisplay offerors={["see"]} />)

    await waitFor(() => {
      screen.getAllByText(/testable/i)
    })
  })

  test("Display single testimonial if there's only one testimonial", async () => {
    setupAPIs()

    const attestations = factory.testimonials({ count: 1 })

    setMockResponse.get(
      expect.stringContaining(urls.testimonials.list({})),
      attestations,
    )

    renderWithProviders(<TestimonialDisplay offerors={["see"]} />)

    await waitFor(() => {
      expect(screen.getAllByText(/testable/i).length).toBe(1)
    })
  })

  test("Display nothing if there's no testimonials", async () => {
    setupAPIs()

    const attestations = {}

    setMockResponse.get(
      expect.stringContaining(urls.testimonials.list({})),
      attestations,
    )

    renderWithProviders(<TestimonialDisplay offerors={["see"]} />)

    await waitFor(() => {
      expect(screen.queryAllByText(/testable/i).length).toBe(0)
    })
  })
})
