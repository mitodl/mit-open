/**
 * Re-exports from MUI.
 *
 * This might expose more props than we want to expose. On the other hand, it
 * means that:
 *  - we get MUI's docstrings
 *  - we don't need to implement ref-forwarding, which is important for some
 *    functionality.
 */
export { default as Button } from "@mui/material/Button"
export type { ButtonProps } from "@mui/material/Button"
export { default as IconButton } from "@mui/material/IconButton"
export type { IconButtonProps } from "@mui/material/IconButton"

export * from "./components/ButtonLink"
export * from "./components/ChipLink"
