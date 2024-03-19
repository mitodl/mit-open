/**
 * We generate an API client for the frontend using openapi-generator-typescript-axios.
 *
 * The generated code does not provide easy access to URLs, which are useful for
 * mocking requests during tests.
 */

import type {
  LearningResourcesApi as LRApi,
  TopicsApi,
  LearningpathsApi,
  ArticlesApi,
} from "../generated/v1"
import type { BaseAPI } from "../generated/v1/base"

// OpenAPI Generator declares parameters using interfaces, which makes passing
// them to functions a little annoying.
// See https://stackoverflow.com/questions/37006008/typescript-index-signature-is-missing-in-type for details.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const query = (params: any) => {
  if (!params || Object.keys(params).length === 0) return ""
  return `?${new URLSearchParams(params).toString()}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Callable = (...args: any[]) => void
type Params<API extends BaseAPI, K extends keyof API> = API[K] extends Callable
  ? Parameters<API[K]>[0]
  : never

const learningResources = {
  list: (params?: Params<LRApi, "learningResourcesList">) =>
    `/api/v1/learning_resources/${query(params)}`,
  details: (params: Params<LRApi, "learningResourcesRetrieve">) =>
    `/api/v1/learning_resources/${params.id}/`,
}

const topics = {
  list: (params?: Params<TopicsApi, "topicsList">) =>
    `/api/v1/topics/${query(params)}`,
}

const learningPaths = {
  list: (params?: Params<LearningpathsApi, "learningpathsList">) =>
    `/api/v1/learningpaths/${query(params)}`,
  resources: ({
    learning_resource_id: parentId,
    ...others
  }: Params<LearningpathsApi, "learningpathsItemsList">) =>
    `/api/v1/learningpaths/${parentId}/items/${query(others)}`,
  resourceDetails: ({
    learning_resource_id: parentId,
    id,
  }: Params<LearningpathsApi, "learningpathsItemsPartialUpdate">) =>
    `/api/v1/learningpaths/${parentId}/items/${id}/`,
  details: (params: Params<LearningpathsApi, "learningpathsRetrieve">) =>
    `/api/v1/learningpaths/${params.id}/`,
}

const articles = {
  list: (params?: Params<ArticlesApi, "articlesList">) =>
    `/api/v1/articles/${query(params)}`,
  details: (id: number) => `/api/v1/articles/${id}/`,
}

const fields = {
  details: (fieldName: string) => `/api/v0/fields/${fieldName}/`,
}

const widgetLists = {
  details: (id: number) => `/api/v0/widget_lists/${id}/`,
}

const programLetters = {
  details: (id: string) => `/api/v1/program_letters/${id}/`,
}

const search = {
  resources: () => "/api/v1/learning_resources_search/",
}

export {
  learningResources,
  topics,
  learningPaths,
  articles,
  search,
  programLetters,
  fields,
  widgetLists,
}
