import React from "react"
import type { FieldChannel } from "api/v0"
import { styled } from "ol-components"
export const AVATAR_SMALL = "small" as const
export const AVATAR_MEDIUM = "medium" as const
export const AVATAR_LARGE = "large" as const

type ImageVariant = "normal" | "inverted"

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
  imageVariant?: ImageVariant | null
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
const FONT_STYLES = {
  small: "subtitle1",
  medium: "h3",
  large: "h2",
} as const

type AvatarStyleProps = Required<Pick<AvatarProps, "imageSize">>
const AvatarContainer = styled.div<AvatarStyleProps>`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: ${({ imageSize }) => IMG_SIZES[imageSize]};
  width: auto;
`
const AvatarImg = styled.img<AvatarStyleProps>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  min-height: 0;
  min-width: 0;
  ${({ imageVariant }) =>
    imageVariant === "inverted" ? "filter: invert(1);" : ""}
  height: ${({ imageSize }) => IMG_SIZES[imageSize]};
  width: auto;
`
const AvatarInitials = styled(AvatarImg.withComponent("div"))(
  ({ theme, imageSize = "medium" }) => ({
    ...theme.typography[FONT_STYLES[imageSize]],
    color: "white",
  }),
)

const FieldAvatar: React.FC<AvatarProps> = (props) => {
  const {
    field,
    formImageUrl,
    imageSize = "medium",
    imageVariant = "normal",
  } = props

  const imageUrl = formImageUrl || getImage(field, imageSize)

  return (
    <AvatarContainer imageSize={imageSize}>
      {!imageUrl ? (
        <AvatarInitials imageSize={imageSize}>
          {initials(field.title)}
        </AvatarInitials>
      ) : (
        <AvatarImg
          src={imageUrl}
          imageSize={imageSize}
          imageVariant={imageVariant}
        />
      )}
    </AvatarContainer>
  )
}

export default FieldAvatar
