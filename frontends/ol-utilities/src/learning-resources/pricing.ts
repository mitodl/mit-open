import { LearningResource } from "api"

type Prices = {
  course: null | number
  certificate: null | number
  displayCourse?: null | string
  displayCertificate?: null | string
}

const getPrices = (resource: LearningResource) => {
  const prices: Prices = {
    course: null,
    certificate: null,
  }

  if (!resource) {
    return prices
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
        course: +Infinity,
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
          course: +Infinity,
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
      course: resource.free ? 0 : +Infinity,
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

const getDisplayPrice = (price: number | number[] | null) => {
  if (price === null) {
    return null
  }
  if (price === 0) {
    return "Free"
  }
  if (price === +Infinity) {
    return "Paid"
  }
  if (Array.isArray(price)) {
    return `$${getDisplayPrecision(price[0])} - $${getDisplayPrecision(price[1])}`
  }
  return `$${getDisplayPrecision(price)}`
}

export const getLearningResourcePrices = (resource: LearningResource) => {
  const prices = getPrices(resource)
  return {
    ...prices,
    displayCourse: getDisplayPrice(prices.course),
    displayCertificate: getDisplayPrice(prices.certificate),
  }
}
