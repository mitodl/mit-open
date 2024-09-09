import { buildQueries, within } from "@testing-library/react"
import type { GetErrorFunction } from "@testing-library/react"

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

export {
  queryAllByTerm,
  queryByTerm,
  getAllByTerm,
  getByTerm,
  findAllByTerm,
  findByTerm,
}
