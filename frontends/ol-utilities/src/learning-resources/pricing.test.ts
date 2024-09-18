import { factories } from "api/test-utils"
import { getLearningResourcePrices } from "./pricing"

describe("getLearningResourcePrices", () => {
  it("free course with no certificate", async () => {
    const resource = factories.learningResources.resource({
      free: true,
      certification: false,
      prices: ["0"],
    })
    expect(getLearningResourcePrices(resource)).toEqual({
      course: { value: [0], display: "Free" },
      certificate: { value: null, display: null },
    })
  })

  it("free course with certificate", async () => {
    const resource = factories.learningResources.resource({
      free: true,
      certification: true,
      prices: ["0", "49"],
    })
    expect(getLearningResourcePrices(resource)).toEqual({
      course: { value: [0], display: "Free" },
      certificate: { value: [49], display: "$49" },
    })
  })

  it("free course with certificate range", async () => {
    const resource = factories.learningResources.resource({
      free: true,
      certification: true,
      prices: ["0", "99", "49"],
    })
    expect(getLearningResourcePrices(resource)).toEqual({
      course: { value: [0], display: "Free" },
      certificate: { value: [49, 99], display: "$49 – $99" },
    })
  })

  it("paid course without certificate", async () => {
    const resource = factories.learningResources.resource({
      free: false,
      certification: false,
      prices: ["49"],
    })
    expect(getLearningResourcePrices(resource)).toEqual({
      course: { value: [49], display: "$49" },
      certificate: { value: null, display: null },
    })
  })

  it("paid course with certificate", async () => {
    const resource = factories.learningResources.resource({
      free: false,
      certification: true,
      prices: ["49"],
    })
    expect(getLearningResourcePrices(resource)).toEqual({
      course: { value: [49], display: "$49" },
      certificate: { value: null, display: null },
    })
  })

  it("paid course with certificate range", async () => {
    const resource = factories.learningResources.resource({
      free: false,
      certification: true,
      prices: ["49", "99"],
    })
    expect(getLearningResourcePrices(resource)).toEqual({
      course: { value: [49, 99], display: "$49 – $99" },
      certificate: { value: null, display: null },
    })
  })
})
