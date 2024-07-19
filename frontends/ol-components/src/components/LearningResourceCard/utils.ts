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
   * @type {null | number | number[] | typeof PAID}
   * @memberof Prices
   */
  course: null | number | number[] | typeof PAID
  /**
   * The price of the certificate, which can be a number or a range of numbers.
   *
   * @type {null | number | number[]}
   * @memberof Prices
   */
  certificate: null | number | number[]
}

const getPrices = (resource: LearningResource): Prices => {
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
      course: 0,
      certificate: null,
    }
  }

  const resourcePrices = resource.prices
    .map((price) => Number(price))
    .sort((a, b) => a - b)

  if (resourcePrices.length > 1) {
    /* The resource is free and offers a paid certificate option, e.g.
     * { prices: [0, 49], free: true, certification: true }
     */
    if (resource.certification && resource.free) {
      const certificatedPrices = resourcePrices.filter((price) => price > 0)
      return {
        course: 0,
        certificate:
          certificatedPrices.length === 1
            ? certificatedPrices[0]
            : [
                certificatedPrices[0],
                certificatedPrices[certificatedPrices.length - 1],
              ],
      }
    }

    /* The resource is not free and has a range of prices, e.g.
     * { prices: [950, 999], free: false, certification: true|false }
     */
    if (resource.certification && !resource.free && Number(resourcePrices[0])) {
      return {
        course: [resourcePrices[0], resourcePrices[resourcePrices.length - 1]],
        certificate: null,
      }
    }

    /* The resource is not free but has a zero price option (prices not ingested correctly)
     * { prices: [0, 999], free: false, certification: true|false }
     */
    if (!resource.free && !Number(resourcePrices[0])) {
      return {
        course: PAID,
        certificate: null,
      }
    }

    /* We are not expecting multiple prices for courses with no certificate option.
     * For resourses always certificated, there is one price that includes the certificate.
     */
  } else if (resourcePrices.length === 1) {
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
        course: 0,
        certificate: null,
      }
    } else {
      /* If the course has no free option, the price of the certificate
       * is included in the price of the course.
       */
      return {
        course: Number(resourcePrices[0]),
        certificate: null,
      }
    }
  } else if (resourcePrices.length === 0) {
    return {
      course: resource.free ? 0 : PAID,
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
  if (price === 0) {
    return FREE
  }
  if (price === PAID) {
    return PAID
  }
  if (Array.isArray(price)) {
    return `$${getDisplayPrecision(price[0])} - $${getDisplayPrecision(price[1])}`
  }
  return `$${getDisplayPrecision(price)}`
}

export const getDisplayPrices = (resource: LearningResource) => {
  const prices = getPrices(resource)
  return {
    course: getDisplayPrice(prices.course),
    certificate: getDisplayPrice(prices.certificate),
  }
}
