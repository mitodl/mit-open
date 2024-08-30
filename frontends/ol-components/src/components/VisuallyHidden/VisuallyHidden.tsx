import styled from "@emotion/styled"

/**
 * VisuallyHidden is a utility component that hides its children from sighted
 * users, but keeps them accessible to screen readers.
 *
 * Often, screenreader-only content can be handled with an `aria-label`. However,
 * occasionally we need actual elements.
 *
 * Example:
 *  - a visually hidden Heading for a section whose purpose is clear for sighted users
 *  - a visually hidden description used for aria-describeddby
 *     - There is an aria-descriptionby attribute that can be used to provide a
 *       without an actual element on the page. However, it is introduced in
 *       ARIA 1.3 (working draft), not compatible with some screen readers, and
 *       flagged problematic by our linting.
 *
 * The CSS here is based on https://inclusive-components.design/tooltips-toggletips/
 */
const VisuallyHidden = styled.span({
  clipPath: "inset(100%)",
  clip: "rect(1px, 1px, 1px, 1px)",
  height: "1px",
  overflow: "hidden",
  position: "absolute",
  whiteSpace: "nowrap",
  width: "1px",
})

export { VisuallyHidden }
