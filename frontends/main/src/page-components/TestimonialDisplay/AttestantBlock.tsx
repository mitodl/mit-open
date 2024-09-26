import React from "react"
import { RiAccountCircleFill } from "@remixicon/react"
import { TruncateText, styled, theme } from "ol-components"
import type { Attestation } from "api/v0"
import Image from "next/image"

type AttestantAvatarPosition = "start" | "end"
type AttestantBlockColor = "light" | "dark"
type AttestantAvatarStyle = "homepage" | "unit"
type AttestantBlockVariant = "standard" | "condensed"

type AttestantBlockChildProps = {
  avatarPosition?: AttestantAvatarPosition
  avatarStyle?: AttestantAvatarStyle
  color?: AttestantBlockColor
  variant?: AttestantBlockVariant
}

type AttestantBlockProps = AttestantBlockChildProps & {
  attestation: Attestation
}

const StyledRiAccountCircleFill = styled(RiAccountCircleFill)({
  width: "40px",
  height: "40px",
})

const AttestantBlockContainer = styled.cite<AttestantBlockChildProps>(
  (props) => {
    const flexDir = props.avatarPosition === "end" ? "row-reverse" : "row"

    return [
      {
        display: "flex",
        flexShrink: 0,
        flexDirection: flexDir,
        width: props.avatarPosition === "end" ? "100%" : "300px",
        marginLeft: props.avatarPosition === "end" ? "0px" : "24px",
        ...theme.typography.body3,
        [theme.breakpoints.down("sm")]: {
          width: "100%",
          height: "56px",
          marginTop: props.avatarPosition === "end" ? "0px" : "24px",
          marginLeft: "0px",
        },
      },
    ]
  },
)

const AttestantAvatar = styled.div<AttestantBlockChildProps>((props) => {
  return [
    {
      marginRight: props.avatarPosition === "end" ? "0px" : "12px",
      marginLeft: props.avatarPosition === "end" ? "14px" : "0px",
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
        display: props.avatarStyle === "homepage" ? "none" : "block",
      },
    },
  ]
})

const AttestantNameBlock = styled.div<AttestantBlockChildProps>((props) => {
  return [
    {
      flexGrow: "1",
      width: "auto",
      textAlign: props.avatarPosition === "end" ? "end" : "start",
      color:
        props.color === "light"
          ? theme.custom.colors.lightGray2
          : theme.custom.colors.silverGrayDark,
    },
  ]
})

const AttestantName = styled.div<AttestantBlockChildProps>((props) => {
  const desktopFont =
    props.variant === "standard"
      ? theme.typography.h5
      : theme.typography.subtitle1
  return [
    {
      ...desktopFont,
      whiteSpace: "nowrap",
      color:
        props.color === "light"
          ? theme.custom.colors.white
          : theme.custom.colors.darkGray2,
      lineHeight: "125%",
      [theme.breakpoints.down("sm")]: {
        ...theme.typography.subtitle1,
      },
    },
  ]
})

const AttestantTitle = styled.div<AttestantBlockChildProps>((props) => {
  const desktopFont =
    props.variant === "standard"
      ? theme.typography.body1
      : theme.typography.body3
  return [
    {
      ...desktopFont,
      color:
        props.color === "light"
          ? theme.custom.colors.lightGray2
          : theme.custom.colors.silverGrayDark,
      [theme.breakpoints.down("sm")]: {
        ...theme.typography.body2,
      },
    },
  ]
})

const AttestantBlock: React.FC<AttestantBlockProps> = ({
  attestation,
  avatarPosition = "start",
  avatarStyle: avatar = "unit",
  color = "light",
  variant = "standard",
}) => {
  return (
    <AttestantBlockContainer avatarPosition={avatarPosition} color={color}>
      <AttestantAvatar
        avatarPosition={avatarPosition}
        color={color}
        avatarStyle={avatar}
      >
        {attestation.avatar_medium ? (
          <Image src={attestation.avatar_medium} alt="" width={40} height={40} />
        ) : (
          <StyledRiAccountCircleFill />
        )}
      </AttestantAvatar>
      <AttestantNameBlock avatarPosition={avatarPosition} color={color}>
        <AttestantName
          avatarPosition={avatarPosition}
          color={color}
          variant={variant}
        >
          {attestation?.attestant_name}
        </AttestantName>
        <AttestantTitle variant={variant} color={color}>
          <TruncateText lineClamp={2}>{attestation.title}</TruncateText>
        </AttestantTitle>
      </AttestantNameBlock>
    </AttestantBlockContainer>
  )
}

export default AttestantBlock
