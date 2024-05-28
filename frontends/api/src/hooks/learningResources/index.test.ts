import { renderHook, waitFor } from "@testing-library/react"
import { faker } from "@faker-js/faker/locale/en"

import { setupReactQueryTest } from "../test-utils"
import keyFactory, { invalidateResourceQueries } from "./keyFactory"
import {
  useLearningResourcesDetail,
  useLearningResourcesList,
  useLearningPathsDetail,
  useLearningPathsList,
  useLearningResourceTopics,
  useInfiniteLearningPathItems,
  useLearningpathCreate,
  useLearningpathDestroy,
  useLearningpathUpdate,
  useLearningpathRelationshipMove,
  useLearningpathRelationshipCreate,
  useLearningpathRelationshipDestroy,
} from "./index"
import { setMockResponse, urls, makeRequest } from "../../test-utils"
import * as factory from "../../test-utils/factories/learningResources"
import { UseQueryResult } from "@tanstack/react-query"

jest.mock("./keyFactory", () => {
  const actual = jest.requireActual("./keyFactory")
  return {
    __esModule: true,
    ...actual,
    invalidateResourceQueries: jest.fn(),
  }
})

/**
 * Assert that `hook` queries the API with the correct `url`, `method`, and
 * exposes the API's data.
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

describe("useLearningResourcesList", () => {
  it.each([undefined, { limit: 5 }, { limit: 5, offset: 10 }])(
    "Calls the correct API",
    async (params) => {
      const data = factory.resources({ count: 3 })
      const url = urls.learningResources.list(params)
      const { wrapper } = setupReactQueryTest()
      setMockResponse.get(url, data)
      const useTestHook = () => useLearningResourcesList(params)
      const { result } = renderHook(useTestHook, { wrapper })
      assertApiCalled(result, url, "GET", data)
    },
  )
})

describe("useLearningResourcesRetrieve", () => {
  it("Calls the correct API", async () => {
    const data = factory.resource()
    const params = { id: data.id }
    const url = urls.learningResources.details(params)

    const { wrapper } = setupReactQueryTest()
    setMockResponse.get(url, data)
    const useTestHook = () => useLearningResourcesDetail(params.id)
    const { result } = renderHook(useTestHook, { wrapper })

    assertApiCalled(result, url, "GET", data)
  })
})

describe("useLearningPathsList", () => {
  it.each([undefined, { limit: 5 }, { limit: 5, offset: 10 }])(
    "Calls the correct API",
    async (params) => {
      const data = factory.learningPaths({ count: 3 })
      const url = urls.learningPaths.list(params)

      const { wrapper } = setupReactQueryTest()
      setMockResponse.get(url, data)
      const useTestHook = () => useLearningPathsList(params)
      const { result } = renderHook(useTestHook, { wrapper })

      assertApiCalled(result, url, "GET", data)
    },
  )
})

describe("useLearningPathsRetrieve", () => {
  it("Calls the correct API", async () => {
    const data = factory.learningPath()
    const params = { id: data.id }
    const url = urls.learningPaths.details(params)

    const { wrapper } = setupReactQueryTest()
    setMockResponse.get(url, data)
    const useTestHook = () => useLearningPathsDetail(params.id)
    const { result } = renderHook(useTestHook, { wrapper })

    assertApiCalled(result, url, "GET", data)
  })
})

describe("useLearningResourceTopics", () => {
  it.each([undefined, { limit: 5 }, { limit: 5, offset: 10 }])(
    "Calls the correct API",
    async (params) => {
      const data = factory.topics({ count: 3 })
      const url = urls.topics.list(params)

      const { wrapper } = setupReactQueryTest()
      setMockResponse.get(url, data)
      const useTestHook = () => useLearningResourceTopics(params)
      const { result } = renderHook(useTestHook, { wrapper })

      assertApiCalled(result, url, "GET", data)
    },
  )
})

describe("useInfiniteLearningPathItems", () => {
  it("Calls the correct API and can fetch next page", async () => {
    const parentId = faker.number.int()
    const url1 = urls.learningPaths.resources({
      learning_resource_id: parentId,
    })
    const url2 = urls.learningPaths.resources({
      learning_resource_id: parentId,
      offset: 5,
    })
    const response1 = factory.learningPathRelationships({
      count: 7,
      parent: parentId,
      next: url2,
      pageSize: 5,
    })
    const response2 = factory.learningPathRelationships({
      count: 7,
      pageSize: 2,
      parent: parentId,
    })
    setMockResponse.get(url1, response1)
    setMockResponse.get(url2, response2)
    const useTestHook = () =>
      useInfiniteLearningPathItems({ learning_resource_id: parentId })

    const { wrapper } = setupReactQueryTest()

    // First page
    const { result } = renderHook(useTestHook, { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(makeRequest).toHaveBeenCalledWith("get", url1, undefined)

    // Second page
    result.current.fetchNextPage()
    await waitFor(() => expect(result.current.isFetching).toBe(false))
    expect(makeRequest).toHaveBeenCalledWith("get", url2, undefined)
  })
})

describe("LearningPath CRUD", () => {
  const makeData = () => {
    const path = factory.learningPath()
    const relationship = factory.learningPathRelationship({ parent: path.id })
    const keys = {
      learningResources: keyFactory._def,
      childResource: keyFactory.detail(relationship.child).queryKey,
      relationshipListing: keyFactory.learningpaths._ctx.detail(path.id)._ctx
        .infiniteItems._def,
    }
    const pathUrls = {
      list: urls.learningPaths.list(),
      details: urls.learningPaths.details({ id: path.id }),
      relationshipList: urls.learningPaths.resources({
        learning_resource_id: path.id,
      }),
      relationshipDetails: urls.learningPaths.resourceDetails({
        id: relationship.id,
        learning_resource_id: path.id,
      }),
    }
    return { path, relationship, pathUrls, keys }
  }

  test("useLearningpathCreate calls correct API", async () => {
    const { path, pathUrls, keys } = makeData()
    const url = pathUrls.list

    const requestData = { title: path.title }
    setMockResponse.post(pathUrls.list, path)

    const { wrapper, queryClient } = setupReactQueryTest()
    jest.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(useLearningpathCreate, {
      wrapper,
    })
    result.current.mutate(requestData)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(makeRequest).toHaveBeenCalledWith("post", url, requestData)
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      keys.learningResources,
    )
  })

  test("useLearningpathDestroy calls correct API", async () => {
    const { path, pathUrls } = makeData()
    const url = pathUrls.details
    setMockResponse.delete(url, null)

    const { wrapper, queryClient } = setupReactQueryTest()
    const { result } = renderHook(useLearningpathDestroy, {
      wrapper,
    })
    result.current.mutate({ id: path.id })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(makeRequest).toHaveBeenCalledWith("delete", url, undefined)
    expect(invalidateResourceQueries).toHaveBeenCalledWith(queryClient, path.id)
  })

  test("useLearningpathUpdate calls correct API", async () => {
    const { path, pathUrls } = makeData()
    const url = pathUrls.details
    const patch = { id: path.id, title: path.title }
    setMockResponse.patch(url, path)

    const { wrapper, queryClient } = setupReactQueryTest()
    const { result } = renderHook(useLearningpathUpdate, { wrapper })
    result.current.mutate(patch)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(makeRequest).toHaveBeenCalledWith("patch", url, patch)

    expect(invalidateResourceQueries).toHaveBeenCalledWith(queryClient, path.id)
  })

  test("useLearningpathRelationshipMove calls correct API", async () => {
    const { relationship, pathUrls, keys } = makeData()
    const url = pathUrls.relationshipDetails
    setMockResponse.patch(url, null)

    const { wrapper, queryClient } = setupReactQueryTest()
    jest.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(useLearningpathRelationshipMove, { wrapper })
    result.current.mutate(relationship)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(makeRequest).toHaveBeenCalledWith(
      "patch",
      url,
      expect.objectContaining({ position: relationship.position }),
    )

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      keys.relationshipListing,
    )
  })

  test("useLearningpathRelationshipCreate calls correct API and patches child resource cache", async () => {
    const { relationship, pathUrls, keys } = makeData()
    const url = pathUrls.relationshipList
    const requestData = {
      child: relationship.child,
      parent: relationship.parent,
      position: relationship.position,
    }
    setMockResponse.post(url, relationship)

    const { wrapper, queryClient } = setupReactQueryTest()
    const { result } = renderHook(useLearningpathRelationshipCreate, {
      wrapper,
    })
    result.current.mutate(requestData)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(makeRequest).toHaveBeenCalledWith("post", url, requestData)

    expect(invalidateResourceQueries).toHaveBeenCalledWith(
      queryClient,
      relationship.child,
    )
    expect(invalidateResourceQueries).toHaveBeenCalledWith(
      queryClient,
      relationship.parent,
    )

    // Check patches cached result
    expect(queryClient.getQueryData(keys.childResource)).toEqual(
      relationship.resource,
    )
  })

  test("useLearningpathRelationshipDestroy calls correct API and patches child resource cache", async () => {
    const { relationship, pathUrls, keys } = makeData()
    const url = pathUrls.relationshipDetails

    setMockResponse.delete(url, null)
    const { wrapper, queryClient } = setupReactQueryTest()
    queryClient.setQueryData(keys.childResource, relationship.resource)
    const { result } = renderHook(useLearningpathRelationshipDestroy, {
      wrapper,
    })

    result.current.mutate(relationship)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(makeRequest).toHaveBeenCalledWith("delete", url, undefined)
    expect(invalidateResourceQueries).toHaveBeenCalledWith(
      queryClient,
      relationship.child,
    )
    expect(invalidateResourceQueries).toHaveBeenCalledWith(
      queryClient,
      relationship.parent,
    )

    // Patched existing resource
    expect(queryClient.getQueryData(keys.childResource)).toEqual({
      ...relationship.resource,
      learning_path_parents: [],
    })
  })
})
