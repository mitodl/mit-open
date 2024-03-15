import {
  LearningResourcesApi,
  LearningpathsApi,
  TopicsApi,
  ArticlesApi,
  ProgramLettersApi,
  LearningResourcesSearchApi,
} from "./generated/api"
import axiosInstance from "./axios"

const BASE_PATH = ""
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

const topicsApi = new TopicsApi(undefined, BASE_PATH, axiosInstance)

const articlesApi = new ArticlesApi(undefined, BASE_PATH, axiosInstance)

const programLettersApi = new ProgramLettersApi(
  undefined,
  BASE_PATH,
  axiosInstance,
)
export {
  learningResourcesApi,
  learningpathsApi,
  topicsApi,
  articlesApi,
  programLettersApi,
  learningResourcesSearchApi,
}
