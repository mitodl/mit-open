import React from "react"
import styled from "@emotion/styled"
import { pxToRem } from "../ThemeProvider/typography"
import tinycolor from "tinycolor2"
import { Link } from "react-router-dom"

type ButtonVariant = "outlined" | "filled" | "text"
type ButtonSize = "small" | "medium" | "large"
type ButtonEdge = "rounded" | "sharp"
type ButtonColor = "primary" | "secondary"

type ButtonStyleProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  edge?: ButtonEdge
  color?: ButtonColor
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
}

const defaultProps: Required<Omit<ButtonStyleProps, "startIcon" | "endIcon">> =
  {
    variant: "filled",
    size: "medium",
    edge: "sharp",
    color: "primary",
  }

const ButtonStyled = styled.button<ButtonStyleProps>((props) => {
  const { color, size, variant, edge, theme } = {
    ...defaultProps,
    ...props,
  }
  const { palette, typography } = theme
  return [
    {
      color: theme.palette.text.primary,
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
      padding: "0px 24px",
      height: `calc(48px - 16px + ${pxToRem(16)})`, // 48px at default base font size
      ...typography.buttonLarge,
    },
    size === "medium" && {
      padding: "0px 16px",
      height: `calc(40px - 14px + ${pxToRem(14)})`, // 40px at default base font size
      ...typography.button,
    },
    size === "small" && {
      padding: "0px 12px",
      height: `calc(32px - 12px + ${pxToRem(12)})`, // 32px at default base font size
      ...typography.buttonSmall,
    },
    // variant
    variant === "filled" && {
      backgroundColor: palette[color].main,
      color: palette[color].contrastText,
      border: "none",
      ":hover:not(:disabled)": {
        backgroundColor: palette[color].active,
      },
      ":disabled": {
        background: palette.action.disabled,
      },
    },
    (variant === "outlined" || variant === "text") && {
      backgroundColor: "transparent",
      borderColor: "currentcolor",
      borderStyle: variant === "outlined" ? "solid" : "none",
      borderWidth: {
        small: "1px",
        medium: "1.5px",
        large: "2px",
      }[size],
      color: palette[color].main,
      ":hover:not(:disabled)": {
        backgroundColor: tinycolor(palette[color].main)
          .setAlpha(0.06)
          .toString(),
      },
      ":disabled": {
        color: palette.action.disabled,
      },
    },
    // edge
    edge === "sharp" && {
      borderRadius: "4px",
    },
    edge === "rounded" && {
      // Pill-shaped buttons... Overlapping border radius get clipped to pill.
      borderRadius: "100vh",
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
    side === "start" && {
      marginLeft: "-4px",
      marginRight: "4px",
    },
    side === "end" && {
      marginLeft: "4px",
      marginRight: "-4px",
    },
    {
      "& .MuiSvgIcon-root": {
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

const LinkStyled = styled(ButtonStyled.withComponent(Link))({
  ":hover": {
    textDecoration: "none",
  },
})

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

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => (
    <ButtonStyled ref={ref} type="button" {...props}>
      <ButtonInner {...props}>{children}</ButtonInner>
    </ButtonStyled>
  ),
)

type ButtonLinkProps = ButtonStyleProps &
  React.ComponentProps<"a"> & { href: string }

const ButtonLink: React.FC<ButtonLinkProps> = ({
  children,
  href,
  ...props
}) => (
  <LinkStyled to={href} {...props}>
    <ButtonInner {...props}>{children}</ButtonInner>
  </LinkStyled>
)

const ActionButtonDefaultProps: Required<
  Omit<ButtonStyleProps, "startIcon" | "endIcon">
> = {
  variant: "filled",
  size: "medium",
  edge: "sharp",
  color: "primary",
}

type ActionButtonProps = Omit<ButtonStyleProps, "startIcon" | "endIcon"> &
  React.ComponentProps<"button">
const ActionButton = styled(
  React.forwardRef<HTMLButtonElement, ActionButtonProps>((props, ref) => (
    <ButtonStyled ref={ref} type="button" {...props} />
  )),
)((props: ActionButtonProps) => {
  const { size = ActionButtonDefaultProps.size } = props
  return {
    padding: 0,
    width: {
      small: "32px",
      medium: "40px",
      large: "48px",
    }[size],
    "& .MuiSvgIcon-root": {
      fontSize: pxToRem(
        {
          small: 16,
          medium: 20,
          large: 24,
        }[size],
      ),
    },
  }
})

export { Button, ButtonLink, ActionButton }
export type { ButtonProps, ButtonLinkProps }
