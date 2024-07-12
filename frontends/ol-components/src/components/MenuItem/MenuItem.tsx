import MuiMenuItem from "@mui/material/MenuItem"
import type { MenuItemProps as MuiMenuItemProps } from "@mui/material/MenuItem"
import styled from "@emotion/styled"

type MenuItemProps = MuiMenuItemProps & {
  size?: "small" | "medium" | "large"
}

const DEFAULT_SIZE = "medium"

const MenuItem = styled(MuiMenuItem)<MenuItemProps>(
  ({ theme, size = DEFAULT_SIZE }) => [
    {
      padding: "8px 12px",
      color: theme.custom.colors.darkGray2,
      backgroundColor: theme.custom.colors.white,
      "&:hover": {
        backgroundColor: theme.custom.colors.lightGray1,
      },
      "&.Mui-disabled": {
        opacity: 1,
        color: theme.custom.colors.silverGrayDark,
        backgroundColor: theme.custom.colors.white,
      },
      '&.Mui-selected:not(.Mui-disabled), .MuiAutocomplete-listbox &.MuiAutocomplete-option[aria-selected="true"].Mui-focused, .MuiAutocomplete-listbox &.MuiAutocomplete-option[aria-selected="true"]':
        {
          backgroundColor: theme.custom.colors.red,
          color: theme.custom.colors.white,
          "&:hover": {
            backgroundColor: theme.custom.colors.mitRed,
          },
        },
      ".MuiAutocomplete-listbox &.MuiAutocomplete-option.Mui-focusVisible": {
        /**
         * For autocomplete fields in particular, the input field maintains
         * focus while the menu is open, so browser does not provide its default
         * focus styling. MUI does provide its own styling for focusVisible in
         * this case, but we tend to use the outline generally.
         */
        outline: [
          "2px auto rgb(0, 95, 204)", // fallback
          "2px auto Highlight", // firefox
          "2px auto -webkit-focus-ring-color", // webkit,
        ],
      },
    },
    size === "small" && {
      ...theme.typography.body3,
    },
    size === "medium" && {
      ...theme.typography.body2,
    },
    size === "large" && {
      ...theme.typography.body1,
    },
  ],
)

export { MenuItem }
export type { MenuItemProps }
