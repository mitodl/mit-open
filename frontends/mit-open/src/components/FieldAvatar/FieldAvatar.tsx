import React from "react"

import type { FieldChannel } from "api/v0"
import { styled } from "ol-components"
export const AVATAR_SMALL = "small" as const
export const AVATAR_MEDIUM = "medium" as const
export const AVATAR_LARGE = "large" as const

type ImageSize =
  | typeof AVATAR_SMALL
  | typeof AVATAR_MEDIUM
  | typeof AVATAR_LARGE

type AvatarProps = {
  imageSize?: ImageSize
  field: FieldChannel
  editable?: boolean
  formImageUrl?: string | null
  name?: string
}

const initials = (title: string): string => {
  return title
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((item) => (item[0] ?? "").toUpperCase())
    .join("")
}

const getImage = (field: FieldChannel, imageSize: ImageSize | undefined) => {
  switch (imageSize) {
    case AVATAR_LARGE:
      return field.avatar
    case AVATAR_SMALL:
      return field.avatar_small
    default:
      return field.avatar_medium
  }
}

const IMG_SIZES = {
  small: "22px",
  medium: "57px",
  large: "90px",
}
const FONT_SIZES = {
  small: "15px",
  medium: "32px",
  large: "50px",
}

type AvatarStyleProps = Required<Pick<AvatarProps, "imageSize">>
const AvatarContainer = styled.div<AvatarStyleProps>`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: ${({ imageSize }) => IMG_SIZES[imageSize]};
  height: ${({ imageSize }) => IMG_SIZES[imageSize]};
`
const AvatarImg = styled.img<AvatarStyleProps>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  min-height: 0;
  min-width: 0;
  border-radius: 15px;
  width: ${({ imageSize }) => IMG_SIZES[imageSize]};
  height: ${({ imageSize }) => IMG_SIZES[imageSize]};
`
const AvatarInitials = styled(AvatarImg.withComponent("div"))`
  font-size: ${({ imageSize = "medium" }) => FONT_SIZES[imageSize]};
  font-weight: 600;
  color: white;
`

const FieldAvatar: React.FC<AvatarProps> = (props) => {
  const { field, formImageUrl, imageSize = "medium" } = props

  const imageUrl = formImageUrl || getImage(field, imageSize)

  return (
    <AvatarContainer imageSize={imageSize}>
      {!imageUrl ? (
        <AvatarInitials imageSize={imageSize}>
          {initials(field.title)}
        </AvatarInitials>
      ) : (
        <AvatarImg src={imageUrl} imageSize={imageSize} />
      )}
    </AvatarContainer>
  )
}

export default FieldAvatar
