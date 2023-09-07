import "jest-extended"
import "jest-extended/all"

import { setupMockEditors } from "ol-ckeditor/test_utils"
import { mockAxiosInstance } from "./mockAxios"
import { makeUserSettings } from "./factories"

setupMockEditors()

jest.mock("axios", () => {
  return {
    __esModule: true,
    default:    {
      create: () => mockAxiosInstance
    }
  }
})

const _createSettings = () => ({
  embedlyKey:        "fake",
  ocw_next_base_url: "fake-ocw.com",
  search_page_size:  4,
  user:              makeUserSettings()
})

window.SETTINGS = _createSettings()

afterEach(() => {
  window.SETTINGS = _createSettings()
})

/**
 * We frequently spy on these, so let's just do it once.
 */
jest.mock("ol-search-ui", () => {
  const actual = jest.requireActual("ol-search-ui")
  return {
    ...actual,
    LearningResourceCardTemplate:    jest.fn(actual.LearningResourceCardTemplate),
    ExpandedLearningResourceDisplay: jest.fn(
      actual.ExpandedLearningResourceDisplay
    )
  }
})
jest.mock("../components/LearningResourceCard", () => {
  const actual = jest.requireActual("../components/LearningResourceCard")
  return {
    __esModule: true,
    ...actual,
    default:    jest.fn(actual.default)
  }
})
