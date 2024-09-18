import { LearningResource, ResourceTypeEnum } from "api"
import { findBestRun } from "ol-utilities"

/*
 * This constant represents the value displayed when a course is free.
 */
const FREE = "Free"

/*
 * This constant represents the value displayed when a course is paid, but the price is not specified.
 */
const PAID = "Paid"

type Prices = {
  /**
   * The price of the course, which can be a number or a range of numbers.
   * If the course is free, the value is 0. If the course is paid, the value is "Paid".
   *
   * @type {null | number[] | typeof PAID}
   * @memberof Prices
   */
  course: null | number[] | typeof PAID
  /**
   * The price of the certificate, which can be a number or a range of numbers.
   *
   * @type {null | number[]}
   * @memberof Prices
   */
  certificate: null | number[]
}

const getPrices = (resource: LearningResource): Prices => {
  const sortedNonzero = resource.prices
    .map((price) => Number(price))
    .sort((a, b) => a - b)
    .filter((price) => price > 0)

  const priceRange = sortedNonzero.filter(
    (price, index, arr) => index === 0 || index === arr.length - 1,
  )
  const prices = priceRange.length > 0 ? priceRange : null

  if (resource.free) {
    return resource.certification
      ? { course: [0], certificate: prices }
      : { course: [0], certificate: null }
  }
  return {
    course: prices ?? PAID,
    certificate: null,
  }
}

const getDisplayPrecision = (price: number) => {
  if (Number.isInteger(price)) {
    return price.toFixed(0)
  }
  return price.toFixed(2)
}

const getDisplayPrice = (price: Prices["course"] | Prices["certificate"]) => {
  if (price === null) {
    return null
  }
  if (price === PAID) {
    return PAID
  }
  if (price.length > 1) {
    return `$${getDisplayPrecision(price[0])} – $${getDisplayPrecision(price[1])}`
  } else if (price.length === 1) {
    if (price[0] === 0) {
      return FREE
    }
    return `$${getDisplayPrecision(price[0])}`
  }
  return null
}

export const getLearningResourcePrices = (resource: LearningResource) => {
  const prices = getPrices(resource)
  return {
    course: {
      value: prices.course,
      display: getDisplayPrice(prices.course),
    },
    certificate: {
      value: prices.certificate,
      display: getDisplayPrice(prices.certificate),
    },
  }
}

export const showStartAnytime = (resource: LearningResource) => {
  return (
    resource.availability === "anytime" &&
    (
      [ResourceTypeEnum.Course, ResourceTypeEnum.Program] as ResourceTypeEnum[]
    ).includes(resource.resource_type)
  )
}

export const getResourceDate = (resource: LearningResource): string | null => {
  const startDate =
    resource.next_start_date ?? findBestRun(resource.runs ?? [])?.start_date

  return startDate ?? null
}
