import type { AxiosError } from "axios"
import handleNotFound from "./handleNotFound"
import { nextNavigationMocks } from "ol-test-utilities/mocks/nextNavigation"

describe("Handle not found wrapper utility", () => {
  test("Should call notFound() for errors with status 404", async () => {
    const error: Partial<AxiosError> = {
      status: 404,
      message: "Not Found",
    }

    const promise = Promise.reject(error)

    await handleNotFound(promise)

    expect(nextNavigationMocks.notFound).toHaveBeenCalled()
  })

  test("Should not call notFound() for success and return result", async () => {
    const resolvedValue = { data: "success" }
    const promise = Promise.resolve(resolvedValue)

    const result = await handleNotFound(promise)

    expect(result).toEqual(resolvedValue)
    expect(nextNavigationMocks.notFound).not.toHaveBeenCalled()
  })

  test("Should rethrow non 404 errors", async () => {
    const error = new Error("Something went wrong")

    const promise = Promise.reject(error)

    await expect(handleNotFound(promise)).rejects.toThrow(
      "Something went wrong",
    )
    expect(nextNavigationMocks.notFound).not.toHaveBeenCalled()
  })
})
