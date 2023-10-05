import { renderHook, waitFor } from "@testing-library/react"

import { setupReactQueryTest } from "../test-utils"
import keyFactory from "./keyFactory"
import { setMockResponse, urls, makeRequest } from "../../test-utils"
import { UseQueryResult } from "@tanstack/react-query"
import { articles as factory } from "../../test-utils/factories"
import {
  useArticleList,
  useArticleDetail,
  useArticleCreate,
  useArticlePartialUpdate,
  useArticleDestroy,
} from "./index"

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

describe("useArticleList", () => {
  it.each([undefined, { limit: 5 }, { limit: 5, offset: 10 }])(
    "Calls the correct API",
    async (params) => {
      const data = factory.articles({ count: 3 })
      const url = urls.articles.list(params)
      const { wrapper } = setupReactQueryTest()
      setMockResponse.get(url, data)
      const useTestHook = () => useArticleList(params)
      const { result } = renderHook(useTestHook, { wrapper })
      assertApiCalled(result, url, "GET", data)
    },
  )
})

describe("useArticleDetail", () => {
  it("Calls the correct API", async () => {
    const data = factory.article()
    const url = urls.articles.details(data.id)

    const { wrapper } = setupReactQueryTest()
    setMockResponse.get(url, data)
    const useTestHook = () => useArticleDetail(data.id)
    const { result } = renderHook(useTestHook, { wrapper })

    assertApiCalled(result, url, "GET", data)
  })
})

describe("Article CRUD", () => {
  test("useArticleCreate calls correct API", async () => {
    const url = urls.articles.list()
    const data = factory.article()
    const { id, ...requestData } = factory.article()
    setMockResponse.post(url, data)

    const { wrapper, queryClient } = setupReactQueryTest()
    jest.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(useArticleCreate, { wrapper })
    result.current.mutate(requestData)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(makeRequest).toHaveBeenCalledWith("post", url, requestData)
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      keyFactory.list._def,
    )
  })

  test("useArticlePartialUpdate calls correct API", async () => {
    const article = factory.article()
    const url = urls.articles.details(article.id)
    setMockResponse.patch(url, article)

    const { wrapper, queryClient } = setupReactQueryTest()
    jest.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(useArticlePartialUpdate, { wrapper })
    result.current.mutate(article)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const { id, ...patchData } = article
    expect(makeRequest).toHaveBeenCalledWith("patch", url, patchData)
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(keyFactory._def)
  })

  test("useArticleDestroy calls correct API", async () => {
    const { id } = factory.article()
    const url = urls.articles.details(id)
    setMockResponse.delete(url, null)

    const { wrapper, queryClient } = setupReactQueryTest()
    jest.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(useArticleDestroy, { wrapper })
    result.current.mutate(id)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(makeRequest).toHaveBeenCalledWith("delete", url, undefined)
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      keyFactory.list._def,
    )
  })
})
