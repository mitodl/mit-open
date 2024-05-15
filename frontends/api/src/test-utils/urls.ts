/**
 * We generate an API client for the frontend using openapi-generator-typescript-axios.
 *
 * The generated code does not provide easy access to URLs, which are useful for
 * mocking requests during tests.
 */

import type { NewsEventsApiNewsEventsListRequest, TestimonialsApi } from "../generated/v0"
import type {
  LearningResourcesApi as LRApi,
  FeaturedApi,
  TopicsApi,
  LearningpathsApi,
  ArticlesApi,
  UserlistsApi,
  OfferorsApi,
  PlatformsApi,
  LearningResourcesUserSubscriptionApi as SubscriptionApi,
  DepartmentsApi,
  SchoolsApi,
  LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest as LearningResourcesSearchRequest,
} from "../generated/v1"
import type { BaseAPI } from "../generated/v1/base"
import type { BaseAPI as BaseAPIv0 } from "../generated/v0/base"

// OpenAPI Generator declares parameters using interfaces, which makes passing
// them to functions a little annoying.
// See https://stackoverflow.com/questions/37006008/typescript-index-signature-is-missing-in-type for details.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const query = (params: any) => {
  if (!params || Object.keys(params).length === 0) return ""
  return `?${new URLSearchParams(params).toString()}`
}

const queryify = (params: unknown) => {
  if (!params || Object.keys(params).length === 0) return ""
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, String(v)))
    } else {
      query.append(key, String(value))
    }
  }
  return `?${query.toString()}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Callable = (...args: any[]) => void
type Params<API extends BaseAPI, K extends keyof API> = API[K] extends Callable
  ? Parameters<API[K]>[0]
  : never
type Paramsv0<
  API extends BaseAPIv0,
  K extends keyof API,
> = API[K] extends Callable ? Parameters<API[K]>[0] : never

const learningResources = {
  list: (params?: Params<LRApi, "learningResourcesList">) =>
    `/api/v1/learning_resources/${query(params)}`,
  details: (params: Params<LRApi, "learningResourcesRetrieve">) =>
    `/api/v1/learning_resources/${params.id}/`,
  featured: (params?: Params<FeaturedApi, "featuredList">) =>
    `/api/v1/featured/${query(params)}`,
}

const offerors = {
  list: (params?: Params<OfferorsApi, "offerorsList">) =>
    `/api/v1/offerors/${query(params)}`,
}

const platforms = {
  list: (params?: Params<PlatformsApi, "platformsList">) =>
    `/api/v1/platforms/${query(params)}`,
}

const topics = {
  list: (params?: Params<TopicsApi, "topicsList">) =>
    `/api/v1/topics/${query(params)}`,
}

const departments = {
  list: (params?: Params<DepartmentsApi, "departmentsList">) =>
    `/api/v1/departments/${query(params)}`,
}

const schools = {
  list: (params?: Params<SchoolsApi, "schoolsList">) =>
    `/api/v1/schools/${query(params)}`,
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

const userLists = {
  list: (params?: Params<UserlistsApi, "userlistsList">) =>
    `/api/v1/userlists/${query(params)}`,
  resources: ({
    userlist_id: parentId,
    ...others
  }: Params<UserlistsApi, "userlistsItemsList">) =>
    `/api/v1/userlists/${parentId}/items/${query(others)}`,
  resourceDetails: ({
    userlist_id: parentId,
    id,
  }: Params<UserlistsApi, "userlistsItemsPartialUpdate">) =>
    `/api/v1/userlists/${parentId}/items/${id}/`,
  details: (params: Params<UserlistsApi, "userlistsRetrieve">) =>
    `/api/v1/userlists/${params.id}/`,
}

const articles = {
  list: (params?: Params<ArticlesApi, "articlesList">) =>
    `/api/v1/articles/${query(params)}`,
  details: (id: number) => `/api/v1/articles/${id}/`,
}

const userSubscription = {
  list: (
    params?: Params<SubscriptionApi, "learningResourcesUserSubscriptionList">,
  ) => `/api/v1/learning_resources_user_subscription/${query(params)}`,
  check: (
    params?: Params<
      SubscriptionApi,
      "learningResourcesUserSubscriptionCheckList"
    >,
  ) => `/api/v1/learning_resources_user_subscription/check/${query(params)}`,
  delete: (id: number) =>
    `/api/v1/learning_resources_user_subscription/${id}/unsubscribe/`,
  post: () => "/api/v1/learning_resources_user_subscription/subscribe/",
}

const fields = {
  details: (channelType: string, name: string) =>
    `/api/v0/channels/type/${channelType}/${name}/`,
  patch: (id: number) => `/api/v0/channels/${id}/`,
}

const widgetLists = {
  details: (id: number) => `/api/v0/widget_lists/${id}/`,
}

const programLetters = {
  details: (id: string) => `/api/v1/program_letters/${id}/`,
}

const testimonials = {
  list: (params?: Paramsv0<TestimonialsApi, "testimonialsList">) =>
    `/api/v0/testimonials/${query(params)}`,
  details: (id: number) => `/api/v0/testimonials/${id}/`,
}

const search = {
  resources: (params?: LearningResourcesSearchRequest) =>
    `/api/v1/learning_resources_search/${queryify(params)}`,
}

const userMe = {
  get: () => "/api/v0/users/me/",
}

const newsEvents = {
  list: (params?: NewsEventsApiNewsEventsListRequest) =>
    `/api/v0/news_events/${query(params)}`,
}

export {
  learningResources,
  topics,
  learningPaths,
  articles,
  search,
  userLists,
  programLetters,
  fields,
  widgetLists,
  offerors,
  userMe,
  platforms,
  userSubscription,
  schools,
  departments,
  newsEvents,
  testimonials,
}
