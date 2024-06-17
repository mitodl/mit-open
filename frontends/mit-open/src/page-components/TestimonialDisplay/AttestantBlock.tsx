import React from "react"

import { styled, theme } from "ol-components"
import type { Attestation } from "api/v0"

type AttestantBlockVariant = "start" | "end"
type AttestantBlockColor = "light" | "dark"

type AttestantBlockChildProps = {
  variant?: AttestantBlockVariant
  color?: AttestantBlockColor
}

type AttestantBlockProps = AttestantBlockChildProps & {
  attestation: Attestation
}

const AttestantBlockContainer = styled.div<AttestantBlockChildProps>(
  (props) => {
    const flexDir = props.variant === "end" ? "row-reverse" : "row"

    return [
      {
        width: "100%",
        display: "flex",
        flexDirection: flexDir,
        [theme.breakpoints.down("md")]: {
          marginTop: "24px",
        },
      },
    ]
  },
)

const AttestantAvatar = styled.div<AttestantBlockChildProps>((props) => {
  return [
    {
      marginRight: props.variant === "end" ? "0px" : "12px",
      marginLeft: props.variant === "end" ? "14px" : "0px",
      [theme.breakpoints.down("md")]: {
        marginRight: "0",
        marginLeft: "0",
      },
      img: {
        objectFit: "cover",
        borderRadius: "50%",
        background: theme.custom.colors.white,
        width: "40px",
        height: "40px",
        boxShadow:
          "0px 2px 4px 0px rgba(37, 38, 43, 0.10), 0px 2px 4px 0px rgba(37, 38, 43, 0.10)",
        [theme.breakpoints.down("md")]: {
          display: "none",
        },
      },
    },
  ]
})

const AttestantNameBlock = styled.div<AttestantBlockChildProps>((props) => {
  return [
    {
      flexGrow: "1",
      width: "auto",
      textAlign: props.variant === "end" ? "end" : "start",
      color:
        props.color === "light"
          ? theme.custom.colors.lightGray2
          : theme.custom.colors.silverGray,
    },
  ]
})

const AttestantName = styled.div<AttestantBlockChildProps>((props) => {
  return [
    {
      ...theme.typography.subtitle1,
      whiteSpace: "nowrap",
      color:
        props.color === "light"
          ? theme.custom.colors.white
          : theme.custom.colors.darkGray2,
      lineHeight: "125%",
    },
  ]
})

const AttestantBlock: React.FC<AttestantBlockProps> = ({
  attestation,
  variant = "start",
  color = "light",
}) => {
  return (
    <AttestantBlockContainer variant={variant} color={color}>
      <AttestantAvatar variant={variant} color={color}>
        <img src={attestation.avatar_medium} />
      </AttestantAvatar>
      <AttestantNameBlock variant={variant} color={color}>
        <AttestantName variant={variant} color={color}>
          {attestation?.attestant_name}
        </AttestantName>
        {attestation.title}
      </AttestantNameBlock>
    </AttestantBlockContainer>
  )
}

export default AttestantBlock
