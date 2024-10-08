import { renderHook, waitFor } from "@testing-library/react"
import { faker } from "@faker-js/faker/locale/en"

import { setupReactQueryTest } from "../test-utils"
import keyFactory, {
  invalidateResourceQueries,
  invalidateUserListQueries,
} from "./keyFactory"
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
  useFeaturedLearningResourcesList,
  useUserListRelationshipCreate,
  useUserListRelationshipDestroy,
} from "./index"
import { setMockResponse, urls, makeRequest } from "../../test-utils"
import * as factories from "../../test-utils/factories"
import { UseQueryResult } from "@tanstack/react-query"
import { LearningResource } from "../../generated/v1"

const factory = factories.learningResources

jest.mock("./keyFactory", () => {
  const actual = jest.requireActual("./keyFactory")
  return {
    __esModule: true,
    ...actual,
    invalidateResourceQueries: jest.fn(),
    invalidateUserListQueries: jest.fn(),
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
  expect(
    makeRequest.mock.calls.some((args) => {
      // Don't use toHaveBeenCalledWith. It doesn't handle undefined 3rd arg.
      return args[0].toUpperCase() === method && args[1] === url
    }),
  ).toBe(true)
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
      await assertApiCalled(result, url, "GET", data)
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

    await assertApiCalled(result, url, "GET", data)
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

      await assertApiCalled(result, url, "GET", data)
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

    await assertApiCalled(result, url, "GET", data)
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

      await assertApiCalled(result, url, "GET", data)
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

    const resourceWithoutList: LearningResource = {
      ...relationship.resource,
      learning_path_parents:
        relationship.resource.learning_path_parents?.filter(
          (m) => m.id !== relationship.id,
        ) ?? null,
    }
    return { path, relationship, pathUrls, keys, resourceWithoutList }
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

  test.each([{ isChildFeatured: false }, { isChildFeatured: true }])(
    "useLearningpathRelationshipCreate calls correct API and patches featured resources",
    async ({ isChildFeatured }) => {
      const { relationship, pathUrls, resourceWithoutList } = makeData()

      const featured = factory.resources({ count: 3 })
      if (isChildFeatured) {
        featured.results[0] = resourceWithoutList
      }
      setMockResponse.get(urls.learningResources.featured(), featured)

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
      const { result: featuredResult } = renderHook(
        useFeaturedLearningResourcesList,
        { wrapper },
      )
      await waitFor(() => expect(featuredResult.current.data).toBe(featured))

      result.current.mutate(requestData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(makeRequest).toHaveBeenCalledWith("post", url, requestData)

      expect(invalidateResourceQueries).toHaveBeenCalledWith(
        queryClient,
        relationship.child,
        { skipFeatured: false },
      )
      expect(invalidateResourceQueries).toHaveBeenCalledWith(
        queryClient,
        relationship.parent,
      )
    },
  )

  test.each([{ isChildFeatured: false }, { isChildFeatured: true }])(
    "useLearningpathRelationshipDestroy calls correct API and patches child resource cache (isChildFeatured=$isChildFeatured)",
    async ({ isChildFeatured }) => {
      const { relationship, pathUrls } = makeData()
      const url = pathUrls.relationshipDetails

      const featured = factory.resources({ count: 3 })
      if (isChildFeatured) {
        featured.results[0] = relationship.resource
      }
      setMockResponse.get(urls.learningResources.featured(), featured)

      setMockResponse.delete(url, null)
      const { wrapper, queryClient } = setupReactQueryTest()

      const { result } = renderHook(useLearningpathRelationshipDestroy, {
        wrapper,
      })
      const { result: featuredResult } = renderHook(
        useFeaturedLearningResourcesList,
        { wrapper },
      )

      await waitFor(() => expect(featuredResult.current.data).toBe(featured))
      result.current.mutate(relationship)
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(makeRequest).toHaveBeenCalledWith("delete", url, undefined)
      expect(invalidateResourceQueries).toHaveBeenCalledWith(
        queryClient,
        relationship.child,
        { skipFeatured: false },
      )
      expect(invalidateResourceQueries).toHaveBeenCalledWith(
        queryClient,
        relationship.parent,
      )
    },
  )
})

describe("userlist CRUD", () => {
  const makeData = () => {
    const list = factories.userLists.userList()
    const relationship = factories.userLists.userListRelationship({
      parent: list.id,
    })
    const keys = {
      learningResources: keyFactory._def,
      relationshipListing: keyFactory.userlists._ctx.detail(list.id)._ctx
        .infiniteItems._def,
    }
    const listUrls = {
      list: urls.userLists.list(),
      details: urls.userLists.details({ id: list.id }),
      relationshipList: urls.userLists.resources({
        userlist_id: list.id,
      }),
      relationshipDetails: urls.userLists.resourceDetails({
        id: relationship.id,
        userlist_id: list.id,
      }),
    }

    const resourceWithoutList: LearningResource = {
      ...relationship.resource,
      user_list_parents:
        relationship.resource.user_list_parents?.filter(
          (m) => m.id !== relationship.id,
        ) ?? null,
    }
    return { path: list, relationship, listUrls, keys, resourceWithoutList }
  }

  test.each([{ isChildFeatured: false }, { isChildFeatured: true }])(
    "useUserListRelationshipCreate calls correct API and patches featured resources",
    async ({ isChildFeatured }) => {
      const { relationship, listUrls, resourceWithoutList } = makeData()

      const featured = factory.resources({ count: 3 })
      if (isChildFeatured) {
        featured.results[0] = resourceWithoutList
      }
      setMockResponse.get(urls.learningResources.featured(), featured)

      const url = listUrls.relationshipList
      const requestData = {
        child: relationship.child,
        parent: relationship.parent,
        position: relationship.position,
      }
      setMockResponse.post(url, relationship)

      const { wrapper, queryClient } = setupReactQueryTest()
      const { result } = renderHook(useUserListRelationshipCreate, {
        wrapper,
      })
      const { result: featuredResult } = renderHook(
        useFeaturedLearningResourcesList,
        { wrapper },
      )
      await waitFor(() => expect(featuredResult.current.data).toBe(featured))

      result.current.mutate(requestData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(makeRequest).toHaveBeenCalledWith("post", url, requestData)

      expect(invalidateResourceQueries).toHaveBeenCalledWith(
        queryClient,
        relationship.child,
        { skipFeatured: true },
      )
      expect(invalidateUserListQueries).toHaveBeenCalledWith(
        queryClient,
        relationship.parent,
      )

      // Assert featured API called only once and that the result has been
      // patched correctly. When the child is featured, we do NOT want to make
      // a new API call to /featured, because the results of that API are randomly
      // ordered.
      expect(
        makeRequest.mock.calls.filter((call) => call[0] === "get").length,
      ).toEqual(1)
      if (isChildFeatured) {
        const firstId = featuredResult.current.data?.results.sort()[0].id
        const filtered = featured.results.filter((item) => item.id === firstId)

        expect(filtered[0]).not.toBeNull()
      } else {
        expect(featuredResult.current.data).toEqual(featured)
      }
    },
  )

  test.each([{ isChildFeatured: false }, { isChildFeatured: true }])(
    "useUserListRelationshipDestroy calls correct API and patches child resource cache (isChildFeatured=$isChildFeatured)",
    async ({ isChildFeatured }) => {
      const { relationship, listUrls } = makeData()
      const url = listUrls.relationshipDetails

      const featured = factory.resources({ count: 3 })
      if (isChildFeatured) {
        featured.results[0] = relationship.resource
      }
      setMockResponse.get(urls.learningResources.featured(), featured)

      setMockResponse.delete(url, null)
      const { wrapper, queryClient } = setupReactQueryTest()

      const { result } = renderHook(useUserListRelationshipDestroy, {
        wrapper,
      })
      const { result: featuredResult } = renderHook(
        useFeaturedLearningResourcesList,
        { wrapper },
      )

      await waitFor(() => expect(featuredResult.current.data).toBe(featured))
      result.current.mutate(relationship)
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(makeRequest).toHaveBeenCalledWith("delete", url, undefined)
      expect(invalidateResourceQueries).toHaveBeenCalledWith(
        queryClient,
        relationship.child,
        { skipFeatured: true },
      )
      expect(invalidateUserListQueries).toHaveBeenCalledWith(
        queryClient,
        relationship.parent,
      )

      // Assert featured API called only once and that the result has been
      // patched correctly. When the child is featured, we do NOT want to make
      // a new API call to /featured, because the results of that API are randomly
      // ordered.
      expect(
        makeRequest.mock.calls.filter((call) => call[0] === "get").length,
      ).toEqual(1)
      if (isChildFeatured) {
        const firstId = featuredResult.current.data?.results.sort()[0].id
        const filtered = featured.results.filter((item) => item.id === firstId)

        expect(filtered[0]).not.toBeNull()
      } else {
        expect(featuredResult.current.data).toEqual(featured)
      }
    },
  )
})
