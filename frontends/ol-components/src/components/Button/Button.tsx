import React from "react"
import styled from "@emotion/styled"
import { pxToRem } from "../ThemeProvider/typography"
import tinycolor from "tinycolor2"
import { Link } from "react-router-dom"

type ButtonVariant = "primary" | "secondary" | "tertiary" | "text" | "inverted"
type ButtonSize = "small" | "medium" | "large"
type ButtonEdge = "circular" | "rounded"

type ButtonStyleProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  edge?: ButtonEdge
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
}

const defaultProps: Required<Omit<ButtonStyleProps, "startIcon" | "endIcon">> =
  {
    variant: "primary",
    size: "medium",
    edge: "rounded",
  }

const ButtonStyled = styled.button<ButtonStyleProps>((props) => {
  const { size, variant, edge, theme, color } = {
    ...defaultProps,
    ...props,
  }
  const { typography } = theme
  const { colors } = theme.custom
  const hasBorder = variant === "secondary" || variant === "text"
  const borderWidthPx = hasBorder ? { small: 1, medium: 1, large: 2 }[size] : 0

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
    },
    // size
    size === "large" && {
      padding: `${14 - borderWidthPx}px 24px`,
      ...typography.buttonLarge,
    },
    size === "medium" && {
      padding: `${11 - borderWidthPx}px 16px`,
      ...typography.button,
    },
    size === "small" && {
      padding: `${8 - borderWidthPx}px 12px`,
      ...typography.buttonSmall,
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
      borderWidth: `${borderWidthPx}px`,
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

const AnchorStyled = styled(ButtonStyled.withComponent("a"))({
  ":hover": {
    textDecoration: "none",
  },
})
const LinkStyled = ButtonStyled.withComponent(Link)

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
     * If true, the component will render a native anchor element rather than
     * a react router Link.
     *
     * In general, we want to use Link. It:
     *  - WILL NOT trigger a full page reload for internal links
     *  - WILL trigger a full page reload for external links.
     *
     * However, there are some rare cases where an internal link might need a
     * full page reload, e.g., linking to login or logout pages.
     */
    nativeAnchor?: boolean
  }

const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ children, href = "", nativeAnchor, ...props }, ref) => {
    if (nativeAnchor) {
      return (
        <AnchorStyled href={href} {...props} ref={ref}>
          <ButtonInner {...props}>{children}</ButtonInner>
        </AnchorStyled>
      )
    }
    return (
      <LinkStyled to={href} {...props} ref={ref}>
        <ButtonInner {...props}>{children}</ButtonInner>
      </LinkStyled>
    )
  },
)

const ActionButtonDefaultProps: Required<
  Omit<ButtonStyleProps, "startIcon" | "endIcon">
> = {
  variant: "primary",
  size: "medium",
  edge: "rounded",
}

type ActionButtonProps = Omit<ButtonStyleProps, "startIcon" | "endIcon"> &
  React.ComponentProps<"button">

/**
 * A button that should contain a remixicon icon and nothing else.
 * For a variant that functions as a link, see ActionButtonLink.
 */
const ActionButton = styled(
  React.forwardRef<HTMLButtonElement, ActionButtonProps>((props, ref) => (
    <ButtonStyled ref={ref} type="button" {...props} />
  )),
)((props: ActionButtonProps) => {
  const { size = ActionButtonDefaultProps.size } = props
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
})

type ActionButtonLinkProps = ActionButtonProps &
  React.ComponentProps<"a"> & {
    href: string
    nativeAnchor?: boolean
  }

const ActionButtonLink = ActionButton.withComponent(
  React.forwardRef<HTMLAnchorElement, ActionButtonLinkProps>(
    ({ href, nativeAnchor, ...props }, ref) => {
      if (nativeAnchor) {
        return <AnchorStyled ref={ref} href={href} {...props} />
      }
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
