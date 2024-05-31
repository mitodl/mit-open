import { setupMockEditors } from "ol-ckeditor/test_utils"
import { mockAxiosInstance } from "./mockAxios"

setupMockEditors()

jest.mock("axios", () => {
  const AxiosError = jest.requireActual("axios").AxiosError
  return {
    __esModule: true,
    default: {
      create: () => mockAxiosInstance,
      AxiosError,
    },
    AxiosError,
  }
})

// jest.mock("@/page-components/LearningResourceCard/LearningResourceCard", () => {
//   const actual = jest.requireActual(
//     "@/page-components/LearningResourceCard/LearningResourceCard",
//   )
//   return {
//     __esModule: true,
//     ...actual,
//     default: jest.fn(actual.default),
//   }
// })
