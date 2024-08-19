import { setupMockEditors } from "ol-ckeditor/test_utils"
import { mockAxiosInstance } from "./mockAxios"

setupMockEditors()

process.env.EMBEDLY_KEY = "embedly_key"
process.env.MITOL_API_BASE_URL = "https://api.test.learn.mit.edu"
process.env.PUBLIC_URL = ""
process.env.SITE_NAME = "MIT Learn"

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

beforeEach(() => {
  // React testing library mounts the components into a container, and clears
  // the container automatically after each test.
  // However, react-helmet manipulates the document head, which is outside that
  // container. So we need to clear it manually.
  // document.head.innerHTML = ""
  document.querySelector("title")?.remove()
})

window.scrollTo = jest.fn()
