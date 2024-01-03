import { setupMockEditors } from "ol-ckeditor/test_utils"
import { mockAxiosInstance } from "./mockAxios"
import { makeUserSettings } from "./factories"

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

const _createSettings = () => ({
  embedlyKey: "fake",
  ocw_next_base_url: "fake-ocw.com",
  search_page_size: 4,
  user: makeUserSettings(),
})

window.SETTINGS = _createSettings()

afterEach(() => {
  window.SETTINGS = _createSettings()
})

jest.mock("@/page-components/LearningResourceCard/LearningResourceCard", () => {
  const actual = jest.requireActual(
    "@/page-components/LearningResourceCard/LearningResourceCard",
  )
  return {
    __esModule: true,
    ...actual,
    default: jest.fn(actual.default),
  }
})
