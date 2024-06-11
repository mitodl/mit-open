import { renderHook, waitFor } from "@testing-library/react"

import { setupReactQueryTest } from "../test-utils"
import { setMockResponse, urls, makeRequest } from "../../test-utils"
import { UseQueryResult } from "@tanstack/react-query"
import { testimonials as factory } from "../../test-utils/factories"
import { useTestimonialList, useTestimonialDetail } from "./index"

/**
 * Assert that a react-query hook queries the API with the correct `url`,
 * `method`, and exposes the API's data.
 */
const assertApiCalled = async (
  result: { current: UseQueryResult },
  url: string,
  method: string,
  data: unknown,
) => {
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(makeRequest).toHaveBeenCalledWith(method, url, expect.anything())
  expect(result.current.data).toEqual(data)
}

describe("useTestimonialList", () => {
  it.each([undefined, { limit: 5 }, { limit: 5, offset: 10 }])(
    "Calls the correct API",
    async (params) => {
      const data = factory.testimonials({ count: 3 })
      const url = urls.testimonials.list(params)

      const { wrapper } = setupReactQueryTest()
      setMockResponse.get(url, data)
      const useTestHook = () => useTestimonialList(params)
      const { result } = renderHook(useTestHook, { wrapper })
      assertApiCalled(result, url, "GET", data)
    },
  )
})

describe("useTestimonialDetail", () => {
  it("Calls the correct API", async () => {
    const data = factory.testimonial()
    const url = urls.testimonials.details(data.id)

    const { wrapper } = setupReactQueryTest()
    setMockResponse.get(url, data)
    const useTestHook = () => useTestimonialDetail(data.id)
    const { result } = renderHook(useTestHook, { wrapper })

    assertApiCalled(result, url, "GET", data)
  })
})
