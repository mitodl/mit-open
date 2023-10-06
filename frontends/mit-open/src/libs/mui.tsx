import React from "react"
import { createTheme } from "@mui/material/styles"
import { LinkProps } from "@mui/material/Link"
import {
  Link as RouterLink,
  LinkProps as RouterLinkProps,
} from "react-router-dom"

/**
 * An adapter for MUI's link component to work with react-router.
 *
 * See https://mui.com/material-ui/guides/routing/ for more.
 */
const LinkBehavior = React.forwardRef<
  HTMLAnchorElement,
  Omit<RouterLinkProps, "to"> & { href: RouterLinkProps["to"] }
>((props, ref) => {
  const { href, ...other } = props
  // Map href (Material UI) -> to (react-router)
  return <RouterLink ref={ref} to={href} {...other} />
})

/**
 * MaterialUI Theme for MIT Open
 */
const muiTheme = createTheme({
  palette: {
    primary: {
      main: "#a31f34",
    },
    secondary: {
      main: "#03152d",
    },
  },
  breakpoints: {
    values: {
      // These match our theme breakpoints in breakpoints.scss
      xs: 0, // mui default
      sm: 600, // mui defailt
      md: 840, // custom
      lg: 1200, // mui default
      xl: 1536, // mui default
    },
  },
  components: {
    MuiLink: {
      defaultProps: {
        component: LinkBehavior,
      } as LinkProps,
    },
    MuiButtonBase: {
      defaultProps: {
        LinkComponent: LinkBehavior,
      },
    },
  },
})

export { muiTheme }
