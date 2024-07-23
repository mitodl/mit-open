import { LearningResource } from "api"

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

export const getPrices = (resource: LearningResource): Prices => {
  const prices: Prices = {
    course: null,
    certificate: null,
  }

  if (!resource) {
    return prices
  }

  if (resource.free && !resource.certification) {
    /* The resource is free and does not offer a paid certificate option, e.g.
     * { prices: [0], free: true, certification: false }
     */
    return {
      course: [0],
      certificate: null,
    }
  }

  const resourcePrices = resource.prices
    .map((price) => Number(price))
    .sort((a, b) => a - b)
    .filter((price) => price > 0)

  if (resourcePrices.length > 0) {
    /* The resource is free and offers a paid certificate option, e.g.
     * { prices: [49, 249], free: true, certification: true }
     */
    if (resource.certification && resource.free) {
      return {
        course: [0],
        certificate:
          resourcePrices.length === 1
            ? [resourcePrices[0]]
            : [resourcePrices[0], resourcePrices[resourcePrices.length - 1]],
      }
    }

    /* The resource is not free and has a range of prices, e.g.
     * { prices: [950, 999], free: false, certification: true|false }
     */
    if (resource.certification && !resource.free && resourcePrices.length > 1) {
      return {
        course: [resourcePrices[0], resourcePrices[resourcePrices.length - 1]],
        certificate: null,
      }
    }

    /* We are not expecting multiple prices for courses with no certificate option.
     * For resources always certificated, there is one price that includes the certificate.
     */
    if (resourcePrices.length === 1) {
      if (!Number(resourcePrices[0])) {
        /* Sometimes price info is missing, but the free flag is reliable.
         */
        if (!resource.free) {
          return {
            course: PAID,
            certificate: null,
          }
        }

        return {
          course: [0],
          certificate: null,
        }
      } else {
        /* If the course has no free option, the price of the certificate
         * is included in the price of the course.
         */
        return {
          course: [Number(resourcePrices[0])],
          certificate: null,
        }
      }
    }
  } else if (resourcePrices.length === 0) {
    return {
      course: resource.free ? [0] : PAID,
      certificate: null,
    }
  }

  return prices
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

export const getDisplayPrices = (resource: LearningResource) => {
  const prices = getPrices(resource)
  return {
    course: getDisplayPrice(prices.course),
    certificate: getDisplayPrice(prices.certificate),
  }
}
