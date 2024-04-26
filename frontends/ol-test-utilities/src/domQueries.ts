import { buildQueries, within } from "@testing-library/react"
import type { GetErrorFunction } from "@testing-library/react"
import invariant from "tiny-invariant"

/**
 * Get all <dd> elements whose corresponding <dt> element matches the given term.
 */
const queryAllByTerm = (
  c: HTMLElement,
  term: string,
  { exact = true } = {},
): HTMLElement[] => {
  const matches = within(c)
    .queryAllByRole("term")
    .filter((el) =>
      exact ? el.textContent === term : el.textContent?.includes(term),
    )
    .map((n) => {
      // eslint-disable-next-line testing-library/no-node-access
      const dd = n.nextSibling
      if (dd instanceof HTMLElement && dd.tagName === "DD") return dd
      throw new Error("Expected node to be an <dd> HTMLElement.")
    })
  return matches
}
const getMultipleError: GetErrorFunction = (_c, term: string) =>
  `Found multiple <dd> elements with preceding term: ${term}`
const getMissingError: GetErrorFunction = (_c, term: string) =>
  `Unable to find a <dd> element with preceding term: ${term}`
const byTerm = buildQueries(queryAllByTerm, getMultipleError, getMissingError)

/**
 * Get a unique <dd> elements whose corresponding <dt> element matches the
 * given term, or return null if none exists.
 */
const queryByTerm = byTerm[0]
const getAllByTerm = byTerm[1]
/**
 * Get a unique <dd> elements whose corresponding <dt> element matches the
 * given term. Throws an error if no such element exists.
 */
const getByTerm = byTerm[2]
const findAllByTerm = byTerm[3]
const findByTerm = byTerm[4]

/**
 * Given an HTMLElement with an aria-describedby attribute, return the elements
 * that describe it.
 *
 * This is particularly useful with `@testing-library`, which makes it easy to
 * find form inputs by label, but has no builtin method for finding the
 * corresponding descriptions (which you might want when asserting about form
 * validation).
 */
const getDescriptionsFor = (el: HTMLElement) => {
  const errIdsAttr = el.getAttribute("aria-describedby")
  if (errIdsAttr === null) {
    throw new Error(
      "The specified element does not have an aria-describedby attribute.",
    )
  }
  const errIds = errIdsAttr.split(" ").filter((id) => id.trim())
  if (errIds.length === 0) {
    throw new Error(
      "The specified element does not have associated ariia-describedby ids.",
    )
  }
  const errEls = errIds.map((id) => {
    // eslint-disable-next-line testing-library/no-node-access
    const errEl = document.getElementById(id)
    invariant(errEl instanceof HTMLElement, `No element found with id: ${id}`)
    return errEl
  })

  return errEls
}

const getDescriptionFor = (el: HTMLElement) => {
  const descriptions = getDescriptionsFor(el)
  invariant(descriptions.length === 1, "Expected exactly one description.")
  return descriptions[0]
}

export {
  queryAllByTerm,
  queryByTerm,
  getAllByTerm,
  getByTerm,
  findAllByTerm,
  findByTerm,
  getDescriptionFor,
}
