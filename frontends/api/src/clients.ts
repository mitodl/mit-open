import {
  LearningResourcesApi,
  LearningpathsApi,
  UserlistsApi,
  OfferorsApi,
  TopicsApi,
  ArticlesApi,
  ProgramLettersApi,
  LearningResourcesSearchApi,
  PlatformsApi,
  LearningResourcesUserSubscriptionApi,
  SchoolsApi,
  FeaturedApi,
} from "./generated/v1/api"

import {
  ChannelsApi,
  WidgetListsApi,
  UsersApi,
  NewsEventsApi,
  ProfilesApi,
  TestimonialsApi,
} from "./generated/v0/api"

import axiosInstance from "./axios"

const IS_SERVER = typeof window === "undefined"
const MITOL_API_BASE_URL = IS_SERVER
  ? // NEXT_SERVER_MITOL_API_BASE_URL is generally only needed for local-dev
    // in docker, where the client and server make API calls to different hosts
    (process.env.NEXT_SERVER_MITOL_API_BASE_URL ??
    process.env.NEXT_PUBLIC_MITOL_API_BASE_URL)
  : process.env.NEXT_PUBLIC_MITOL_API_BASE_URL

const BASE_PATH = MITOL_API_BASE_URL?.replace(/\/+$/, "") ?? ""

const learningResourcesApi = new LearningResourcesApi(
  undefined,
  BASE_PATH,
  axiosInstance,
)

const learningResourcesSearchApi = new LearningResourcesSearchApi(
  undefined,
  BASE_PATH,
  axiosInstance,
)

const featuredApi = new FeaturedApi(undefined, BASE_PATH, axiosInstance)

const learningpathsApi = new LearningpathsApi(
  undefined,
  BASE_PATH,
  axiosInstance,
)

const userListsApi = new UserlistsApi(undefined, BASE_PATH, axiosInstance)

const offerorsApi = new OfferorsApi(undefined, BASE_PATH, axiosInstance)

const platformsApi = new PlatformsApi(undefined, BASE_PATH, axiosInstance)

const topicsApi = new TopicsApi(undefined, BASE_PATH, axiosInstance)

const articlesApi = new ArticlesApi(undefined, BASE_PATH, axiosInstance)

const programLettersApi = new ProgramLettersApi(
  undefined,
  BASE_PATH,
  axiosInstance,
)

const channelsApi = new ChannelsApi(undefined, BASE_PATH, axiosInstance)

const widgetListsApi = new WidgetListsApi(undefined, BASE_PATH, axiosInstance)

const searchSubscriptionApi = new LearningResourcesUserSubscriptionApi(
  undefined,
  BASE_PATH,
  axiosInstance,
)

const usersApi = new UsersApi(undefined, BASE_PATH, axiosInstance)

const profilesApi = new ProfilesApi(undefined, BASE_PATH, axiosInstance)

const schoolsApi = new SchoolsApi(undefined, BASE_PATH, axiosInstance)

const newsEventsApi = new NewsEventsApi(undefined, BASE_PATH, axiosInstance)
const testimonialsApi = new TestimonialsApi(undefined, BASE_PATH, axiosInstance)

export {
  learningResourcesApi,
  learningpathsApi,
  userListsApi,
  topicsApi,
  articlesApi,
  offerorsApi,
  programLettersApi,
  learningResourcesSearchApi,
  channelsApi,
  widgetListsApi,
  usersApi,
  profilesApi,
  platformsApi,
  searchSubscriptionApi,
  schoolsApi,
  newsEventsApi,
  featuredApi,
  testimonialsApi,
}
