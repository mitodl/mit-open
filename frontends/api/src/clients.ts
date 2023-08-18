import { LearningResourcesApi } from "./generated/api"
import axiosInstance from "./axios"

const BASE_PATH = ""
const learningResourcesApi = new LearningResourcesApi(
  undefined,
  BASE_PATH,
  axiosInstance
)

export { learningResourcesApi }
