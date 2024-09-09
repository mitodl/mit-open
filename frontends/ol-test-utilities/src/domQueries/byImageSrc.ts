/**
 * Custom queries for finding image elements by src.
 *
 * src assertions could be handled via getByRole("img"), but that approach has
 * some limitations:
 *  - asserting about src is not straightforward if there are multiple images
 *  - image elements may have role "presentation" if they have no alt text
 *
 * Additionally, some images may be optimized by NextJS, in which case the
 * original src url is encoded.
 */

import { buildQueries, isInaccessible } from "@testing-library/react"
import invariant from "tiny-invariant"
import type { GetErrorFunction } from "@testing-library/react"

/**
 * Get the original src of an image element, which may be encoded in a NextJS optimized image src.
 */
const getOriginalSrc = (el: HTMLImageElement) => {
  const src = el.src
  if (new URL(src).pathname.startsWith("/_next")) {
    const url = new URL(src).searchParams.get("url")
    invariant(url, `Expected url query param in ${src}`)
    return decodeURIComponent(url)
  }
  return src
}

type QueryAllByImageSrcOpts = {
  /**
   * Defaults to `true`.
   * If `true`, will decode NextJS optimized image srcs.
   */
  nextJsOriginalSrc?: boolean
  /**
   * Defaults to `false`.
   * If `true`, elements normally hidden from accessibility tree will be included.
   * See https://testing-library.com/docs/queries/byrole/#hidden
   */
  hidden?: boolean
}
const DEFAULT_BY_IMAGE_SRC_OPTS: QueryAllByImageSrcOpts = {
  nextJsOriginalSrc: true,
  hidden: false,
}

/**
 * Get 0+ image element matching specified src.
 * NOTE: decodes NextJS optimized image src by default
 */
const queryAllByImageSrc = (
  c: HTMLElement,
  src: string | RegExp,
  opts?: QueryAllByImageSrcOpts,
): HTMLElement[] => {
  const { nextJsOriginalSrc, hidden } = {
    ...DEFAULT_BY_IMAGE_SRC_OPTS,
    ...opts,
  }
  // Don't query by role, which could be "img" or "presentation" depending on alt text presence
  // but do check that the element is not otherwise inaccessible
  const images = Array.from(c.querySelectorAll("img"))
    .filter((el) => {
      return hidden || !isInaccessible(el)
    })
    .filter((el) => {
      invariant(el instanceof HTMLImageElement, "Expected HTMLImageElement")
      const elSrc = nextJsOriginalSrc ? getOriginalSrc(el) : el.src
      return typeof src === "string" ? elSrc === src : src.test(elSrc)
    })
  return images
}
const getImageSrcs = (c: HTMLElement, opts?: QueryAllByImageSrcOpts) => {
  const { hidden, nextJsOriginalSrc } = {
    ...DEFAULT_BY_IMAGE_SRC_OPTS,
    ...opts,
  }
  return Array.from(c.querySelectorAll("img"))
    .filter((el) => {
      return hidden || !isInaccessible(el)
    })
    .map((el) => (nextJsOriginalSrc ? getOriginalSrc(el) : el.src))
}

const getMultipleError: GetErrorFunction = (
  c,
  src: string | RegExp,
  opts?: QueryAllByImageSrcOpts,
) => {
  invariant(c instanceof HTMLElement, "Container should be an HTMLElement")
  const srcs = getImageSrcs(c, opts).join("\n\t")
  return `Found multiple <img /> elements matching src.\nExpected rrc:\n\t${src}\nFound srcs:\n\t${srcs}`
}
const getMissingError: GetErrorFunction = (
  c,
  src: string | RegExp,
  opts?: QueryAllByImageSrcOpts,
) => {
  invariant(c instanceof HTMLElement, "Container should be an HTMLElement")
  const srcs = getImageSrcs(c, opts).join("\n")
  return `Found zero <img /> elements matching src.\nExpected src:\n\t${src}\nFound srcs:\n\t${srcs}`
}

const byImageSrc = buildQueries(
  queryAllByImageSrc,
  getMultipleError,
  getMissingError,
)

/**
 * Get a unique image element matching specified src, or return null if none
 * NOTE: decodes NextJS optimized image src by default
 */
const queryByImageSrc = byImageSrc[0]
/**
 * Get a 1+ image element matching specified src, or rerror.
 * NOTE: decodes NextJS optimized image src by default
 */
const getAllByImageSrc = byImageSrc[1]
/**
 * Get exactly 1 image element matching specified src, or rerror.
 * NOTE: decodes NextJS optimized image src by default
 */
const getByImageSrc = byImageSrc[2]
/**
 * Async find 1+ image element matching specified src, or rerror.
 * NOTE: decodes NextJS optimized image src by default
 */
const findAllByImageSrc = byImageSrc[3]
/**
 * Async find exactly 1 image element matching specified src, or rerror.
 * NOTE: decodes NextJS optimized image src by default
 */
const findByImageSrc = byImageSrc[4]

export {
  queryAllByImageSrc,
  queryByImageSrc,
  getAllByImageSrc,
  getByImageSrc,
  findAllByImageSrc,
  findByImageSrc,
  getOriginalSrc,
}
