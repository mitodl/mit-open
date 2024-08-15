import React from "react"
import styled from "@emotion/styled"
import Skeleton from "@mui/material/Skeleton"
import {
  RiMenuAddLine,
  RiBookmarkLine,
  RiBookmarkFill,
  RiAwardFill,
} from "@remixicon/react"
import { LearningResource } from "api"
import {
  formatDate,
  getReadableResourceType,
  embedlyCroppedImage,
  DEFAULT_RESOURCE_IMG,
  getLearningResourcePrices,
  getResourceDate,
  showStartAnytime,
} from "ol-utilities"
import { Card } from "../Card/Card"
import type { Size } from "../Card/Card"
import { TruncateText } from "../TruncateText/TruncateText"
import { ActionButton, ActionButtonProps } from "../Button/Button"
import { imgConfigs } from "../../constants/imgConfigs"
import { theme } from "../ThemeProvider/ThemeProvider"
import Tooltip from "@mui/material/Tooltip"

const EllipsisTitle = styled(TruncateText)({
  margin: 0,
})

const SkeletonImage = styled(Skeleton)<{ aspect: number }>`
  padding-bottom: ${({ aspect }) => 100 / aspect}%;
`

const Label = styled.span(({ theme }) => ({
  color: theme.custom.colors.silverGrayDark,
}))

const Value = styled.span<{ size?: Size }>(({ theme, size }) => [
  {
    color: theme.custom.colors.darkGray2,
  },
  size === "small" && {
    color: theme.custom.colors.silverGrayDark,
    ".MitCard-root:hover &": {
      color: theme.custom.colors.darkGray2,
    },
  },
])

const getImageDimensions = (size: Size, isMedia: boolean) => {
  const dimensions = {
    small: { width: 190, height: isMedia ? 190 : 120 },
    medium: { width: 298, height: isMedia ? 298 : 170 },
  }
  return dimensions[size]
}

const getEmbedlyUrl = (
  resource: LearningResource,
  size: Size,
  isMedia: boolean,
) => {
  return embedlyCroppedImage(resource.image!.url!, {
    key: process.env.PUBLIC_NEXT_EMBEDLY_KEY!,
    ...getImageDimensions(size, isMedia),
  })
}

type ResourceIdCallback = (
  event: React.MouseEvent<HTMLButtonElement>,
  resourceId: number,
) => void

const Info = ({
  resource,
  size,
}: {
  resource: LearningResource
  size: Size
}) => {
  const prices = getLearningResourcePrices(resource)
  const certificatePrice =
    size === "small" && prices.certificate.display?.includes("–")
      ? ""
      : prices.certificate.display
        ? prices.certificate.display
        : ""
  const separator = size === "small" ? "" : ": "
  return (
    <>
      <span>{getReadableResourceType(resource.resource_type)}</span>
      <PriceContainer>
        {resource.certification && (
          <Certificate>
            {size === "small" ? (
              <Tooltip title="Certificate">
                <CertificateIconContainer>
                  <RiAwardFill />
                </CertificateIconContainer>
              </Tooltip>
            ) : (
              <RiAwardFill />
            )}
            {size === "small" ? "" : "Certificate"}
            <CertificatePrice>
              {certificatePrice ? `${separator}${certificatePrice}` : ""}
            </CertificatePrice>
          </Certificate>
        )}
        <Price>{prices.course.display}</Price>
      </PriceContainer>
    </>
  )
}

const CertificateIconContainer = styled.div`
  display: flex;
  align-items: center;
`

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const Certificate = styled.div`
  padding: 2px 4px;
  border-radius: 4px;
  color: ${theme.custom.colors.silverGrayDark};
  background-color: ${theme.custom.colors.lightGray1};

  ${{ ...theme.typography.subtitle4 }}
  svg {
    width: 12px;
    height: 12px;
  }

  display: flex;
  align-items: center;
  gap: 4px;
`

const CertificatePrice = styled.div`
  ${{ ...theme.typography.body4 }}
`

export const Price = styled.div`
  ${{ ...theme.typography.subtitle3 }}
  color: ${theme.custom.colors.darkGray2};
`

const StartDate: React.FC<{ resource: LearningResource; size?: Size }> = ({
  resource,
  size,
}) => {
  const anytime = showStartAnytime(resource)
  const startDate = getResourceDate(resource)
  const format = size === "small" ? "MMM DD, YYYY" : "MMMM DD, YYYY"
  const formatted = anytime
    ? "Anytime"
    : startDate && formatDate(startDate, format)
  if (!formatted) return null

  const showLabel = size !== "small" || anytime
  return (
    <>
      {showLabel ? <Label>Starts: </Label> : null}
      <Value size={size}>{formatted}</Value>
    </>
  )
}

interface LearningResourceCardProps {
  isLoading?: boolean
  resource?: LearningResource | null
  className?: string
  size?: Size
  isMedia?: boolean
  href?: string
  onAddToLearningPathClick?: ResourceIdCallback | null
  onAddToUserListClick?: ResourceIdCallback | null
  inUserList?: boolean
  inLearningPath?: boolean
}

const FILLED_PROPS = { variant: "primary" } as const
const UNFILLED_PROPS = { color: "secondary", variant: "secondary" } as const
const CardActionButton: React.FC<
  Pick<ActionButtonProps, "aria-label" | "onClick" | "children"> & {
    filled?: boolean
  }
> = ({ filled, ...props }) => {
  return (
    <ActionButton
      edge="circular"
      size={"small"}
      {...(filled ? FILLED_PROPS : UNFILLED_PROPS)}
      {...props}
    />
  )
}

const StyledCard = styled(Card)<{ size: Size }>(({ size }) => [
  size === "medium" && {
    ".MitCard-info": {
      height: "18px",
    },
  },
])

const LearningResourceCard: React.FC<LearningResourceCardProps> = ({
  isLoading,
  resource,
  className,
  size = "medium",
  isMedia = false,
  href,
  onAddToLearningPathClick,
  onAddToUserListClick,
  inLearningPath,
  inUserList,
}) => {
  if (isLoading) {
    const { width, height } = imgConfigs["column"]
    const aspect = isMedia ? 1 : width / height
    return (
      <StyledCard className={className} size={size}>
        <Card.Content>
          <SkeletonImage variant="rectangular" aspect={aspect} />
          <Skeleton height={25} width="65%" sx={{ margin: "23px 16px 0" }} />
          <Skeleton height={25} width="80%" sx={{ margin: "0 16px 35px" }} />
          <Skeleton height={25} width="30%" sx={{ margin: "0 16px 16px" }} />
        </Card.Content>
      </StyledCard>
    )
  }
  if (!resource) {
    return null
  }
  return (
    <StyledCard href={href} className={className} size={size}>
      <Card.Image
        src={
          resource.image?.url
            ? getEmbedlyUrl(resource, size, isMedia)
            : DEFAULT_RESOURCE_IMG
        }
        alt={resource.image?.alt ?? ""}
        height={`${getImageDimensions(size, isMedia).height}px`}
      />
      <Card.Info>
        <Info resource={resource} size={size} />
      </Card.Info>
      <Card.Title>
        <EllipsisTitle lineClamp={size === "small" ? 2 : 3}>
          {resource.title}
        </EllipsisTitle>
      </Card.Title>
      <Card.Actions>
        {onAddToLearningPathClick && (
          <CardActionButton
            filled={inLearningPath}
            aria-label="Add to Learning Path"
            onClick={(event) => onAddToLearningPathClick(event, resource.id)}
          >
            <RiMenuAddLine />
          </CardActionButton>
        )}
        {onAddToUserListClick && (
          <CardActionButton
            filled={inUserList}
            aria-label="Add to User List"
            onClick={(event) => onAddToUserListClick(event, resource.id)}
          >
            {inUserList ? <RiBookmarkFill /> : <RiBookmarkLine />}
          </CardActionButton>
        )}
      </Card.Actions>
      <Card.Footer>
        <StartDate resource={resource} size={size} />
      </Card.Footer>
    </StyledCard>
  )
}

export { LearningResourceCard }
export type { LearningResourceCardProps }
