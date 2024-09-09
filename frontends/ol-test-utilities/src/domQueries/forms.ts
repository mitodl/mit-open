import invariant from "tiny-invariant"

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

export { getDescriptionsFor, getDescriptionFor }
