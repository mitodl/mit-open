import getCloudServicesConfig from "./cloudServices"
import axios from "axios"
import { faker } from "@faker-js/faker/locale/en"

jest.mock("axios")

describe("cloudServicesConfig", () => {
  const uploadUrl = faker.internet.url()
  beforeAll(() => {
    process.env.NEXT_PUBLIC_CKEDITOR_UPLOAD_URL = uploadUrl
  })

  test("tokenUrl queries correct API", async () => {
    const cloud = getCloudServicesConfig()
    const mockGet = axios.get as jest.Mock
    mockGet.mockResolvedValue({ data: { token: "the-cool-token" } })
    const token = await cloud.tokenUrl()
    expect(token).toBe("the-cool-token")
  })

  test("CKEDITOR_UPLOAD_URL is set from env", () => {
    const cloud = getCloudServicesConfig()
    expect(cloud.uploadUrl).toBe(uploadUrl)
  })
})
