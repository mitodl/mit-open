import { getSearchParamMap } from "./utils"

describe("getSearchParamMap", () => {
  it("should return an empty object when there are no parameters", () => {
    const urlParams = new URLSearchParams()
    const result = getSearchParamMap(urlParams)
    expect(result).toEqual({})
  })

  it("should handle one parameter", () => {
    const urlParams = new URLSearchParams()
    urlParams.append("q", "test search")
    const result = getSearchParamMap(urlParams)
    expect(result).toEqual({ q: ["test search"] })
  })

  it("should handle multiple parameters", () => {
    const urlParams = new URLSearchParams()
    urlParams.append("q", "test search")
    urlParams.append("offeror", "mitx")
    const result = getSearchParamMap(urlParams)
    expect(result).toEqual({ q: ["test search"], offeror: ["mitx"] })
  })

  it("should handle parameters with multiple values", () => {
    const urlParams = new URLSearchParams()
    urlParams.append("topic", "Leadership")
    urlParams.append("topic", "Business")
    const result = getSearchParamMap(urlParams)
    expect(result).toEqual({ topic: ["Leadership", "Business"] })
  })

  it("should handle parameters with comma-separated values", () => {
    const urlParams = new URLSearchParams()
    urlParams.append("topic", "Leadership,Business,Management")
    const result = getSearchParamMap(urlParams)
    expect(result).toEqual({ topic: ["Leadership", "Business", "Management"] })
  })
})
