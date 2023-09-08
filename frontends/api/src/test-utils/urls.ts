/**
 * We generate an API client for the frontend using openapi-generator-typescript-axios.
 *
 * The generated code does not provide easy access to URLs, which are useful for
 * mocking requests during tests.
 */

import type { LearningResourcesApi as LRApi } from "../generated"
import type { BaseAPI } from "../generated/base"

// OpenAPI Generator declares parameters using interfaces, which makes passing
// them to functions a little annoying.
// See https://stackoverflow.com/questions/37006008/typescript-index-signature-is-missing-in-type for details.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const query = (params: any) => {
  if (!params || Object.keys(params).length === 0) return ""
  return `?${new URLSearchParams(params).toString()}`
}

type Params<API extends BaseAPI, K extends keyof API> = Parameters<API[K]>[0]

const learningResources = {
  list: (params?: Params<LRApi, "learningResourcesList">) =>
    `/api/v1/learning_resources/${query(params)}`,
  details: (params: Params<LRApi, "learningResourcesRetrieve">) =>
    `/api/v1/learning_resources/${params.id}/`,
}

export { learningResources }
