import { renderHook, waitFor } from "@testing-library/react"

import { setupReactQueryTest } from "./test-utils"
import {
  useLearningResourcesDetail,
  useLearningResourcesList
} from "./learningResources"
import { setMockResponse, urls, axios } from "../test-utils"
import * as factory from "../test-utils/factories/learningResources"
import { UseQueryResult } from "@tanstack/react-query"

/**
 * Assert that `hook` queries the API with the correct `url`, `method`, and
 * exposes the API's data.
 */
const assertApiCalled = async (
  hook: () => UseQueryResult,
  url: string,
  method: string,
  data: unknown
) => {
  const { wrapper } = setupReactQueryTest()
  setMockResponse.get(url, data)

  const { result } = renderHook(hook, { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))

  expect(axios.request).toHaveBeenCalledWith(
    expect.objectContaining({ method, url })
  )
  expect(result.current.data).toEqual(data)
}

describe("useLearningResourcesList", () => {
  it.each([undefined, { limit: 5 }, { limit: 5, offset: 10 }])(
    "Calls the correct API",
    async params => {
      const resource = factory.resources({ count: 3 })
      const url = urls.learningResources.list(params)
      const useTestHook = () => useLearningResourcesList(params)
      assertApiCalled(useTestHook, url, "GET", resource)
    }
  )
})

describe("useLearningResourcesRetrieve", () => {
  it("Calls the correct API", async () => {
    const resource = factory.resource()
    const params = { id: resource.id }
    const url = urls.learningResources.details(params)
    const useTestHook = () => useLearningResourcesDetail(params.id)
    assertApiCalled(useTestHook, url, "GET", resource)
  })
})
