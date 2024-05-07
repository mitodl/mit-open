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
  SchoolsApi,
} from "./generated/v1/api"

import { ChannelsApi, WidgetListsApi, UsersApi } from "./generated/v0/api"

import axiosInstance from "./axios"

const BASE_PATH = APP_SETTINGS.axios_base_path?.replace(/\/+$/, "") ?? ""
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

const usersApi = new UsersApi(undefined, BASE_PATH, axiosInstance)

const schoolsApi = new SchoolsApi(undefined, BASE_PATH, axiosInstance)

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
  platformsApi,
  schoolsApi,
}
