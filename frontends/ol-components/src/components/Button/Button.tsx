import React from "react"
import styled from "@emotion/styled"
import { pxToRem } from "../ThemeProvider/typography"
import type { Theme } from "@mui/material/styles"
import tinycolor from "tinycolor2"
import { Link } from "react-router-dom"

type ButtonVariant = "outlined" | "filled" | "text"
type ButtonSize = "small" | "medium" | "large"
type ButtonEdge = "rounded" | "sharp"
type ButtonColor = keyof Theme["custom"]["colors"]

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
    color: "red",
  }

const ButtonStyled = styled.button<ButtonStyleProps>((props) => {
  const { color, size, variant, edge, theme } = {
    ...defaultProps,
    ...props,
  }
  const { colors } = theme.custom
  return [
    {
      // font
      lineHeight: 1,
      fontFamily: theme.typography.fontFamily,
      fontWeight: 500,
      color: theme.palette.text.primary,
      // display
      display: "flex",
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
      fontSize: pxToRem(16),
    },
    size === "medium" && {
      padding: "0px 16px",
      height: `calc(40px - 14px + ${pxToRem(14)})`, // 40px at default base font size
      fontSize: pxToRem(14),
    },
    size === "small" && {
      padding: "0px 12px",
      height: `calc(32px - 12px + ${pxToRem(12)})`, // 32px at default base font size
      fontSize: pxToRem(12),
    },
    // variant
    variant === "filled" && {
      backgroundColor: colors[color].main,
      color: colors[color].contrastText,
      border: "none",
      ":hover:not(:disabled)": {
        backgroundColor: colors[color].dark,
      },
      ":disabled": {
        background: colors.disabled.main,
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
      color: colors[color].main,
      ":hover:not(:disabled)": {
        backgroundColor: tinycolor(colors[color].main)
          .setAlpha(0.06)
          .toString(),
      },
      ":disabled": {
        color: colors.disabled.main,
      },
    },
    // edge
    edge === "sharp" && {
      borderRadius: "4px",
    },
    edge === "rounded" && {
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

type ButtonProps = ButtonStyleProps &
  (
    | (React.ComponentProps<"button"> & { as?: undefined })
    | (React.ComponentProps<"a"> & { as: "link"; href: string })
  )

const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  const { size = defaultProps.size } = props
  const content = (
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
  if (props.as === "link") {
    const { href, ...others } = props
    return (
      <LinkStyled to={href} {...others}>
        {content}
      </LinkStyled>
    )
  } else {
    return <ButtonStyled {...props}>{content}</ButtonStyled>
  }
}

export { Button }
