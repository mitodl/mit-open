import type Slick from "react-slick"

const DEFAULT_INTERACTIVE_CHILD_SELECTOR =
  "a, button, input, select, textarea, [tabindex], iframe, [contenteditable=true]"

/**
 * This enhances slick carousel accessibility in a few ways:
 * - Adds `role="group"`
 *  - Adds `aria-label` to each slide indicating slide count
 * - sets tabindex to -1 on interactive elements in aria hidden states
 */
const onReInitSlickA11y = (
  slick: Slick | null,
  interactiveChildSelector: string = DEFAULT_INTERACTIVE_CHILD_SELECTOR,
) => {
  const container = slick?.innerSlider?.list
  if (!container) return

  // These have aria-hidden via slick, but are not fully hidden yet.
  const hidden = container.querySelectorAll('.slick-slide[aria-hidden="true"]')

  // Note: .slick-cloned is used on ifinite carousels. We can ignore those
  // slides, and including them would skew our slide count
  const slides = container.querySelectorAll(".slick-slide:not(.slick-cloned)")

  // Reset tabindex for all card contents so they are reachable for keyboard users
  slides.forEach(function (slide, index) {
    slide.setAttribute("role", "group")
    slide.setAttribute("aria-label", `${index + 1} of ${slides.length}`)
    slide.querySelectorAll(interactiveChildSelector).forEach(function (el) {
      el.removeAttribute("tabindex")
    })
  })

  // Make hidden slides impossible to reach via keyboard, as well as interactive
  // elements within them
  hidden.forEach(function (slide) {
    // Note: Interactive children are removed from tab focus via tabindex
    // rather than using `inert` on the parent slide. This is because `inert`
    // on the parent slide will also disable some CSS effects on the slide.
    // Since our slides have aria-hidden when partially visible, removing css
    // effects is a bit weird without other intentional styling changes
    slide.querySelectorAll(interactiveChildSelector).forEach(function (el) {
      el.setAttribute("tabindex", "-1")
    })
  })
}

export { onReInitSlickA11y }
