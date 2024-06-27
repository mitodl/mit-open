import React from "react"
import styled from "@emotion/styled"
import { pxToRem } from "../ThemeProvider/typography"
import tinycolor from "tinycolor2"
import { Link } from "react-router-dom"
import type { Theme } from "@mui/material/styles"

type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "text"
  | "noBorder"
  | "inverted"
type ButtonSize = "small" | "medium" | "large"
type ButtonEdge = "circular" | "rounded" | "none"

type ButtonStyleProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  edge?: ButtonEdge
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  /**
   * If true (default: `false`), the button will become one size smaller at the
   * `sm` breakpoint.
   *  - large -> medium
   *  - medium -> small
   *  - small -> small
   */
  responsive?: boolean
}

const defaultProps: Required<Omit<ButtonStyleProps, "startIcon" | "endIcon">> =
  {
    variant: "primary",
    size: "medium",
    edge: "rounded",
    responsive: false,
  }

const borderWidths = {
  small: 1,
  medium: 1,
  large: 2,
}
const responsiveSize: Record<ButtonSize, ButtonSize> = {
  small: "small",
  medium: "small",
  large: "medium",
}

const sizeStyles = (size: ButtonSize, hasBorder: boolean, theme: Theme) => {
  const paddingAdjust = hasBorder ? borderWidths[size] : 0
  return [
    {
      borderWidth: borderWidths[size],
    },
    size === "large" && {
      padding: `${14 - paddingAdjust}px 24px`,
      ...theme.typography.buttonLarge,
    },
    size === "medium" && {
      padding: `${11 - paddingAdjust}px 16px`,
      ...theme.typography.button,
    },
    size === "small" && {
      padding: `${8 - paddingAdjust}px 12px`,
      ...theme.typography.buttonSmall,
    },
  ]
}

const ButtonStyled = styled.button<ButtonStyleProps>((props) => {
  const { size, variant, edge, theme, color, responsive } = {
    ...defaultProps,
    ...props,
  }
  const { colors } = theme.custom
  const hasBorder = variant === "secondary" || variant === "text"

  return [
    {
      color: theme.palette.text.primary,
      textAlign: "center",
      // display
      display: "inline-flex",
      justifyContent: "center",
      alignItems: "center",
      // transitions
      transition: `background ${theme.transitions.duration.short}ms`,
      // cursor
      cursor: "pointer",
      ":disabled": {
        cursor: "default",
      },
      minWidth: "100px",
    },
    ...sizeStyles(size, hasBorder, theme),
    // responsive
    responsive && {
      [theme.breakpoints.down("sm")]: sizeStyles(
        responsiveSize[size],
        hasBorder,
        theme,
      ),
    },
    // variant
    variant === "primary" && {
      backgroundColor: colors.mitRed,
      color: colors.white,
      border: "none",
      ":hover:not(:disabled)": {
        backgroundColor: colors.red,
      },
      ":disabled": {
        backgroundColor: colors.silverGray,
      },
    },
    hasBorder && {
      backgroundColor: "transparent",
      borderColor: "currentcolor",
      borderStyle: variant === "secondary" ? "solid" : "none",
    },
    variant === "secondary" && {
      color: colors.red,
      ":hover:not(:disabled)": {
        backgroundColor: tinycolor(colors.brightRed).setAlpha(0.06).toString(),
      },
      ":disabled": {
        color: colors.silverGray,
      },
    },
    variant === "text" && {
      color: colors.darkGray2,
      ":hover:not(:disabled)": {
        backgroundColor: tinycolor(colors.darkGray1).setAlpha(0.06).toString(),
      },
      ":disabled": {
        color: colors.silverGray,
      },
    },
    variant === "noBorder" && {
      backgroundColor: colors.white,
      color: colors.darkGray2,
      border: "none",
      ":hover:not(:disabled)": {
        backgroundColor: tinycolor(colors.darkGray1).setAlpha(0.06).toString(),
      },
      ":disabled": {
        color: colors.silverGray,
      },
    },
    variant === "tertiary" && {
      color: colors.darkGray2,
      border: "none",
      backgroundColor: colors.lightGray2,
      ":hover:not(:disabled)": {
        backgroundColor: colors.white,
      },
      ":disabled": {
        backgroundColor: colors.lightGray2,
        color: colors.silverGrayLight,
      },
    },
    variant === "inverted" && {
      backgroundColor: colors.white,
      color: colors.mitRed,
      borderColor: colors.mitRed,
      borderStyle: "solid",
    },
    // edge
    edge === "rounded" && {
      borderRadius: "4px",
    },
    edge === "circular" && {
      // Pill-shaped buttons... Overlapping border radius get clipped to pill.
      borderRadius: "100vh",
    },
    edge === "none" && {
      border: "none",
      ":hover:not(:disabled)": {
        "&&": {
          backgroundColor: "inherit",
        },
      },
    },
    // color
    color === "secondary" && {
      color: theme.custom.colors.silverGray,
      borderColor: theme.custom.colors.silverGray,
      ":hover:not(:disabled)": {
        backgroundColor: theme.custom.colors.lightGray1,
      },
    },
  ]
})

/**
 * Typically, SVG Icons are structured as `<svg> <path/> </svg>`; the svg is
 * 24x24px by default, but the path may be smaller. I.e., there is generally
 * whitespace around the path.
 *
 * The negative margin below accounts (approximately) for this whitespace.
 * The whitespace varies by icon, so it's not perfect.
 */
const IconContainer = styled.span<{ side: "start" | "end"; size: ButtonSize }>(
  ({ size, side }) => [
    {
      height: "1em",
      display: "flex",
      alignItems: "center",
    },
    side === "start" && {
      marginLeft: "-4px",
      marginRight: "4px",
    },
    side === "end" && {
      marginLeft: "4px",
      marginRight: "-4px",
    },
    {
      "& svg, & .MuiSvgIcon-root": {
        width: "1em",
        height: "1em",
        fontSize: pxToRem(
          {
            small: 16,
            medium: 20,
            large: 24,
          }[size],
        ),
      },
    },
  ],
)

const LinkStyled = styled(ButtonStyled.withComponent(Link), {
  /**
   * There are no extra styles here, emotion seems to forward "responsive"
   * to the underlying dom node without this.
   */
  shouldForwardProp: (prop) => prop !== "responsive",
})({})

type ButtonProps = ButtonStyleProps & React.ComponentProps<"button">

const ButtonInner: React.FC<
  ButtonStyleProps & { children?: React.ReactNode }
> = (props) => {
  const { children, size = defaultProps.size } = props
  return (
    <>
      {props.startIcon ? (
        <IconContainer size={size} side="start">
          {props.startIcon}
        </IconContainer>
      ) : null}
      {children}
      {props.endIcon ? (
        <IconContainer size={size} side="end">
          {props.endIcon}
        </IconContainer>
      ) : null}
    </>
  )
}

/**
 * Our styled button. If you need a link that looks like a button, use ButtonLink
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => (
    <ButtonStyled ref={ref} type="button" {...props}>
      <ButtonInner {...props}>{children}</ButtonInner>
    </ButtonStyled>
  ),
)

type ButtonLinkProps = ButtonStyleProps &
  React.ComponentProps<"a"> & {
    href?: string
    /**
     * If true, the component will skip client-side routing and reload the
     * document as if it were `<a href="..." />`.
     *
     * See https://reactrouter.com/en/main/components/link
     */
    reloadDocument?: boolean
  }

const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ children, href = "", ...props }, ref) => {
    return (
      <LinkStyled to={href} {...props} ref={ref}>
        <ButtonInner {...props}>{children}</ButtonInner>
      </LinkStyled>
    )
  },
)

type ActionButtonProps = Omit<ButtonStyleProps, "startIcon" | "endIcon"> &
  React.ComponentProps<"button">

const actionStyles = (size: ButtonSize) => {
  return {
    padding: 0,
    height: {
      small: "32px",
      medium: "40px",
      large: "48px",
    }[size],
    width: {
      small: "32px",
      medium: "40px",
      large: "48px",
    }[size],
    "& svg, & .MuiSvgIcon-root": {
      width: "1em",
      height: "1em",
      fontSize: pxToRem(
        {
          small: 20,
          medium: 24,
          large: 32,
        }[size],
      ),
    },
  }
}

/**
 * A button that should contain a remixicon icon and nothing else.
 * For a variant that functions as a link, see ActionButtonLink.
 */
const ActionButton = styled(
  React.forwardRef<HTMLButtonElement, ActionButtonProps>((props, ref) => (
    <ButtonStyled ref={ref} type="button" {...props} />
  )),
)(({ theme, size = defaultProps.size, responsive }) => {
  return [
    actionStyles(size),
    responsive && {
      [theme.breakpoints.down("sm")]: actionStyles(responsiveSize[size]),
    },
  ]
})

type ActionButtonLinkProps = ActionButtonProps &
  React.ComponentProps<"a"> &
  Pick<ButtonLinkProps, "reloadDocument">

const ActionButtonLink = ActionButton.withComponent(
  React.forwardRef<HTMLAnchorElement, ActionButtonLinkProps>(
    ({ href = "", ...props }, ref) => {
      return <LinkStyled ref={ref} to={href} {...props} />
    },
  ),
)

export { Button, ButtonLink, ActionButton, ActionButtonLink }
export type {
  ButtonProps,
  ButtonLinkProps,
  ButtonStyleProps,
  ActionButtonProps,
  ActionButtonLinkProps,
}
