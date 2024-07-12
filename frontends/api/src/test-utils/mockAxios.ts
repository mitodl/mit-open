import { when } from "jest-when"
import { isFunction } from "lodash"
import type { AxiosResponse } from "axios"

const AxiosError = jest.requireActual("axios").AxiosError

type Method = "get" | "post" | "patch" | "delete"

type PartialAxiosResponse = Pick<AxiosResponse, "data" | "status">

const alwaysError = (
  method: string,
  url: string,
  _body?: unknown,
): Promise<PartialAxiosResponse> => {
  const msg = `No response specified for ${method} ${url}`
  console.error(msg)
  throw new Error(msg)
}

/**
 * A jest mock function that makes fake network requests.
 *
 * Spy on it to check its calls. For example, to assert that it has been called
 * with a specific value:
 * ```ts
 * expect(makeRequest).toHaveBeenCalledWith([
 *  'post',
 *  '/some/url/to/thing',
 *   expect.objectContaining({ some: 'value' }) // request body
 * ])
 * ```
 */
const makeRequest = jest.fn(alwaysError)

const mockAxiosInstance = {
  get: jest.fn((url: string) => makeRequest("get", url, undefined)),
  post: jest.fn((url: string, body: unknown) => makeRequest("post", url, body)),
  patch: jest.fn((url: string, body: unknown) =>
    makeRequest("patch", url, body),
  ),
  delete: jest.fn((url: string) => makeRequest("delete", url, undefined)),
  request: jest.fn(
    (
      {
        method,
        url,
        data,
      }: {
        method: string
        url: string
        data: unknown
      }, // Axios accepts lowercase or capital method names
    ) => {
      // OpenAPI Generator *always* serializes request bodies before passing to
      // axios. This is fine, but annoying for tests where we may want to assert
      // on object shape.
      const deserialized =
        typeof data === "string" ? JSON.parse(data) : undefined
      return makeRequest(method.toLowerCase(), url, deserialized)
    },
  ),
  defaults: {}, // OpenAPI Generator accesses this, so it needs to exist
}

/**
 * Jest's `expect.anything()` does not match against `null` or `undefined`.
 * This suffices for usage with `when`.
 */
const expectAnythingOrNil = expect.toBeOneOf([
  expect.anything(),
  expect.toBeNil(),
])

const standardizeUrl = <T>(url: T) => {
  if (!(typeof url === "string")) return url
  if (!url.includes("?")) return url
  const [path, queryString] = url.split("?")
  const query = new URLSearchParams(queryString)
  query.sort()
  return `${path}?${query.toString()}`
}

const mockRequest = <T, U>(
  method: Method,
  url: string,
  requestBody: T = expectAnythingOrNil,
  responseBody: U | ((req: T) => U) | undefined = undefined,
  code: number,
) => {
  when(makeRequest)
    .calledWith(method, standardizeUrl(url), requestBody)
    .mockImplementation(async () => {
      let data
      if (isFunction(responseBody)) {
        data = await responseBody(requestBody)
      } else {
        data = await responseBody
      }
      const response = { data, status: code }
      if (code >= 400) {
        throw new AxiosError(
          "Mock Error",
          String(code),
          undefined,
          undefined,
          response as AxiosResponse,
        )
      }
      return response
    })
}

interface MockResponseOptions {
  /**
   * Only match requests with this request body.
   * By default, matches anything, including null and undefined.
   *
   * @notes
   * accepts Jest matches, e.g., `expect.objectContaining({ some: 'prop' })`
   */
  requestBody?: unknown
  code?: number
}

const setMockResponse = {
  /**
   * Set mock response for a GET request; default response status is 200.
   *
   * If `responseBody` is a Promise, the request will resolve to the value of
   * `responseBody` when `responseBody` resolves.
   */
  get: (
    url: string,
    responseBody: unknown,
    { code = 200, requestBody }: MockResponseOptions = {},
  ) => mockRequest("get", url, requestBody, responseBody, code),
  /**
   * Set mock response for a POST request; default response status is 201.
   *
   * If `responseBody` is a Promise, the request will resolve to the value of
   * `responseBody` when `responseBody` resolves.
   */
  post: (
    url: string,
    responseBody?: unknown,
    { code = 201, requestBody }: MockResponseOptions = {},
  ) => mockRequest("post", url, requestBody, responseBody, code),
  /**
   * Set mock response for a PATCH request; default response status is 200.
   *
   * If `responseBody` is a Promise, the request will resolve to the value of
   * `responseBody` when `responseBody` resolves.
   */
  patch: (
    url: string,
    responseBody?: unknown,
    { code = 200, requestBody }: MockResponseOptions = {},
  ) => mockRequest("patch", url, requestBody, responseBody, code),
  /**
   * Set mock response for a PATCH request; default response status is 204.
   *
   * If `responseBody` is a Promise, the request will resolve to the value of
   * `responseBody` when `responseBody` resolves.
   */
  delete: (
    url: string,
    responseBody?: unknown,
    { code = 204, requestBody }: MockResponseOptions = {},
  ) => mockRequest("delete", url, requestBody, responseBody, code),
  /**
   * Set a custom fallback implementation when no responses have been specified.
   *
   * If no custom fallback is specified, unmocked responses will result in an
   * error.
   */
  defaultImplementation: when(makeRequest).defaultImplementation,
}

export { setMockResponse, mockAxiosInstance, makeRequest }
