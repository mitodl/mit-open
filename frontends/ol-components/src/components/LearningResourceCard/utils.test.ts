import { factories } from "api/test-utils"
import { getPrices } from "./utils"

describe("getPrices", () => {
  it("free course with no certificate", async () => {
    const resource = factories.learningResources.resource({
      free: true,
      certification: false,
      prices: ["0"],
    })
    expect(getPrices(resource)).toEqual({ course: [0], certificate: null })
  })

  it("free course with certificate", async () => {
    const resource = factories.learningResources.resource({
      free: true,
      certification: true,
      prices: ["0", "49"],
    })
    expect(getPrices(resource)).toEqual({ course: [0], certificate: [49] })
  })

  it("free course with certificate range", async () => {
    const resource = factories.learningResources.resource({
      free: true,
      certification: true,
      prices: ["0", "99", "49"],
    })
    expect(getPrices(resource)).toEqual({ course: [0], certificate: [49, 99] })
  })

  it("paid course without certificate", async () => {
    const resource = factories.learningResources.resource({
      free: false,
      certification: false,
      prices: ["49"],
    })
    expect(getPrices(resource)).toEqual({ course: [49], certificate: null })
  })

  it("paid course with certificate", async () => {
    const resource = factories.learningResources.resource({
      free: false,
      certification: true,
      prices: ["49"],
    })
    expect(getPrices(resource)).toEqual({ course: [49], certificate: null })
  })

  it("paid course with certificate range", async () => {
    const resource = factories.learningResources.resource({
      free: false,
      certification: true,
      prices: ["49", "99"],
    })
    expect(getPrices(resource)).toEqual({ course: [49, 99], certificate: null })
  })
})
