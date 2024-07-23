import React from "react"
import styled from "@emotion/styled"
import Skeleton from "@mui/material/Skeleton"
import {
  RiMenuAddLine,
  RiBookmarkLine,
  RiBookmarkFill,
  RiAwardFill,
} from "@remixicon/react"
import { LearningResource, ResourceTypeEnum, PlatformEnum } from "api"
import {
  findBestRun,
  formatDate,
  getReadableResourceType,
  embedlyCroppedImage,
  DEFAULT_RESOURCE_IMG,
} from "ol-utilities"
import { Card } from "../Card/Card"
import type { Size } from "../Card/Card"
import { TruncateText } from "../TruncateText/TruncateText"
import { ActionButton, ActionButtonProps } from "../Button/Button"
import { imgConfigs } from "../../constants/imgConfigs"
import { theme } from "../ThemeProvider/ThemeProvider"
import { getDisplayPrices } from "./utils"
import Tooltip from "@mui/material/Tooltip"

const EllipsisTitle = styled(TruncateText)({
  margin: 0,
})

const SkeletonImage = styled(Skeleton)<{ aspect: number }>`
  padding-bottom: ${({ aspect }) => 100 / aspect}%;
`

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
    key: APP_SETTINGS.embedlyKey || process.env.EMBEDLY_KEY!,
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
  const prices = getDisplayPrices(resource)
  const certificatePrice =
    size === "small" && prices?.certificate?.includes("–")
      ? ""
      : prices?.certificate
        ? prices?.certificate
        : ""
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
            {certificatePrice ? `: ${certificatePrice}` : ""}
          </Certificate>
        )}
        <Price>{prices?.course}</Price>
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
  color: ${theme.custom.colors.silverGrayDark};

  ${{ ...theme.typography.subtitle4 }}
  svg {
    width: 12px;
    height: 12px;
  }

  display: flex;
  align-items: center;
  gap: 4px;
`

export const Price = styled.div`
  ${{ ...theme.typography.subtitle3 }}
  color: ${theme.custom.colors.darkGray2};
`

const isOcw = (resource: LearningResource) =>
  resource.resource_type === ResourceTypeEnum.Course &&
  resource.platform?.code === PlatformEnum.Ocw

const getStartDate = (resource: LearningResource, size: Size = "medium") => {
  let startDate = resource.next_start_date

  if (!startDate) {
    const bestRun = findBestRun(resource.runs ?? [])

    if (isOcw(resource) && bestRun?.semester && bestRun?.year) {
      return `${bestRun?.semester} ${bestRun?.year}`
    }
    startDate = bestRun?.start_date
  }

  if (!startDate) return null

  return formatDate(startDate, `MMM${size === "medium" ? "M" : ""} DD, YYYY`)
}

const StartDate: React.FC<{ resource: LearningResource; size?: Size }> = ({
  resource,
  size,
}) => {
  const startDate = getStartDate(resource, size)

  if (!startDate) return null

  const label =
    size === "medium" ? (isOcw(resource) ? "As taught in:" : "Starts:") : ""

  return (
    <>
      {label} <span>{startDate}</span>
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
      <Card className={className} size={size}>
        <Card.Content>
          <SkeletonImage variant="rectangular" aspect={aspect} />
          <Skeleton height={25} width="65%" sx={{ margin: "23px 16px 0" }} />
          <Skeleton height={25} width="80%" sx={{ margin: "0 16px 35px" }} />
          <Skeleton height={25} width="30%" sx={{ margin: "0 16px 16px" }} />
        </Card.Content>
      </Card>
    )
  }
  if (!resource) {
    return null
  }
  return (
    <Card href={href} className={className} size={size}>
      <Card.Image
        src={
          resource.image?.url
            ? getEmbedlyUrl(resource, size, isMedia)
            : DEFAULT_RESOURCE_IMG
        }
        alt={resource.image?.alt ?? ""}
        height={getImageDimensions(size, isMedia).height}
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
    </Card>
  )
}

export { LearningResourceCard }
export type { LearningResourceCardProps }
