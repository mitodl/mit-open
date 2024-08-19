import getCloudServicesConfig from "./cloudServices"
import axios from "axios"

jest.mock("axios")

describe("cloudServicesConfig", () => {
  test("tokenUrl queries correct API", async () => {
    const cloud = getCloudServicesConfig()
    const mockGet = axios.get as jest.Mock
    mockGet.mockResolvedValue({ data: { token: "the-cool-token" } })
    const token = await cloud.tokenUrl()
    expect(token).toBe("the-cool-token")
  })

  test("CKEDITOR_UPLOAD_URL is set from global APP_SETTINGS", () => {
    process.env.CKEDITOR_UPLOAD_URL = "https://meowmeow.com"
    const cloud = getCloudServicesConfig()
    expect(cloud.uploadUrl).toBe("https://meowmeow.com")
  })
})
