import React from "react"

import { RiAccountCircleFill } from "@remixicon/react"

import { TruncateText, styled, theme } from "ol-components"
import type { Attestation } from "api/v0"

type AttestantBlockVariant = "start" | "end"
type AttestantBlockColor = "light" | "dark"
type AttestantAvatarStyle = "homepage" | "unit"

type AttestantBlockChildProps = {
  variant?: AttestantBlockVariant
  color?: AttestantBlockColor
  avatar?: AttestantAvatarStyle
}

type AttestantBlockProps = AttestantBlockChildProps & {
  attestation: Attestation
}

const StyledRiAccountCircleFill = styled(RiAccountCircleFill)({
  width: "40px",
  height: "40px",
})

const AttestantBlockContainer = styled.div<AttestantBlockChildProps>(
  (props) => {
    const flexDir = props.variant === "end" ? "row-reverse" : "row"

    return [
      {
        display: "flex",
        flexShrink: 0,
        flexDirection: flexDir,
        width: props.variant === "end" ? "100%" : "300px",
        marginLeft: props.variant === "end" ? "0px" : "24px",
        ...theme.typography.body3,
        [theme.breakpoints.down("sm")]: {
          width: "100%",
          height: "56px",
          marginTop: props.variant === "end" ? "0px" : "24px",
          marginLeft: "0px",
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
      img: {
        objectFit: "cover",
        borderRadius: "50%",
        background: theme.custom.colors.white,
        width: "40px",
        height: "40px",
        boxShadow:
          "0px 2px 4px 0px rgba(37, 38, 43, 0.10), 0px 2px 4px 0px rgba(37, 38, 43, 0.10)",
      },
      [theme.breakpoints.down("sm")]: {
        display: props.avatar === "homepage" ? "none" : "block",
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
  avatar = "unit",
}) => {
  return (
    <AttestantBlockContainer variant={variant} color={color}>
      <AttestantAvatar variant={variant} color={color} avatar={avatar}>
        {attestation.avatar_medium ? (
          <img src={attestation.avatar_medium} />
        ) : (
          <StyledRiAccountCircleFill />
        )}
      </AttestantAvatar>
      <AttestantNameBlock variant={variant} color={color}>
        <AttestantName variant={variant} color={color}>
          {attestation?.attestant_name}
        </AttestantName>
        <TruncateText lineClamp={2}>{attestation.title}</TruncateText>
      </AttestantNameBlock>
    </AttestantBlockContainer>
  )
}

export default AttestantBlock
