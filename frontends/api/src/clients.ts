import {
  LearningResourcesApi,
  LearningpathsApi,
  TopicsApi,
} from "./generated/api"
import axiosInstance from "./axios"

const BASE_PATH = ""
const learningResourcesApi = new LearningResourcesApi(
  undefined,
  BASE_PATH,
  axiosInstance,
)

const learningpathsApi = new LearningpathsApi(
  undefined,
  BASE_PATH,
  axiosInstance,
)

const topicsApi = new TopicsApi(undefined, BASE_PATH, axiosInstance)

export { learningResourcesApi, learningpathsApi, topicsApi }
