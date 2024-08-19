import { mockAxiosInstance } from "./mockAxios"

process.env.MITOL_AXIOS_WITH_CREDENTIALS = "false"
process.env.MITOL_API_BASE_URL = "https://api.test.learn.mit.edu"
process.env.CSRF_COOKIE_NAME = "csrftoken-test"

jest.mock("axios", () => {
  return {
    __esModule: true,
    default: {
      create: () => mockAxiosInstance,
    },
  }
})
