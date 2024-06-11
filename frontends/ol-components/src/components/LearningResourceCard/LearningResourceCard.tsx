import React from "react"
import styled from "@emotion/styled"
import Skeleton from "@mui/material/Skeleton"
import { RiMenuAddLine, RiBookmarkLine, RiAwardFill } from "@remixicon/react"
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
import { ActionButton } from "../Button/Button"
import { imgConfigs } from "../../constants/imgConfigs"
import { theme } from "../ThemeProvider/ThemeProvider"

const EllipsisTitle = styled(TruncateText)({
  margin: 0,
})

const SkeletonImage = styled(Skeleton)<{ aspect: number }>`
  padding-bottom: ${({ aspect }) => 100 / aspect}%;
`

const getEmbedlyUrl = (resource: LearningResource, size: Size) => {
  const dimensions = {
    small: { width: 190, height: 120 },
    medium: { width: 298, height: 170 },
  }
  return embedlyCroppedImage(resource.image!.url!, {
    key: APP_SETTINGS.embedlyKey || process.env.EMBEDLY_KEY!,
    ...dimensions[size],
  })
}

type ResourceIdCallback = (resourceId: number) => void

const Info = ({ resource }: { resource: LearningResource }) => {
  return (
    <>
      <span>{getReadableResourceType(resource.resource_type)}</span>
      {resource.certification && (
        <Certificate>
          <RiAwardFill />
          Certificate
        </Certificate>
      )}
    </>
  )
}

const Certificate = styled.div`
  border-radius: 4px;
  background-color: ${theme.custom.colors.lightGray1};
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

const isOcw = (resource: LearningResource) =>
  resource.resource_type === ResourceTypeEnum.Course &&
  resource.platform?.code === PlatformEnum.Ocw

const getStartDate = (resource: LearningResource) => {
  let startDate = resource.next_start_date

  if (!startDate) {
    const bestRun = findBestRun(resource.runs ?? [])

    if (isOcw(resource) && bestRun?.semester && bestRun?.year) {
      return `${bestRun?.semester} ${bestRun?.year}`
    }
    startDate = bestRun?.start_date
  }

  if (!startDate) return null

  return formatDate(startDate, "MMMM DD, YYYY")
}

const StartDate: React.FC<{ resource: LearningResource; size?: Size }> = ({
  resource,
  size,
}) => {
  const startDate = getStartDate(resource)

  if (!startDate) return null

  const label = isOcw(resource)
    ? size === "medium"
      ? "As taught in:"
      : ""
    : "Starts:"

  return (
    <>
      {label} <span>{formatDate(startDate, "MMMM DD, YYYY")}</span>
    </>
  )
}

interface LearningResourceCardProps {
  isLoading?: boolean
  resource?: LearningResource | null
  className?: string
  size?: Size
  onAddToLearningPathClick?: ResourceIdCallback | null
  onAddToUserListClick?: ResourceIdCallback | null
}

const LearningResourceCard: React.FC<LearningResourceCardProps> = ({
  isLoading,
  resource,
  className,
  size = "medium",
  onAddToLearningPathClick,
  onAddToUserListClick,
}) => {
  if (isLoading) {
    const { width, height } = imgConfigs["column"]
    return (
      <Card className={className} size={size}>
        <Card.Content>
          <SkeletonImage variant="rectangular" aspect={width / height} />
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
    <Card href={`?resource=${resource.id}`} className={className} size={size}>
      <Card.Image
        src={
          resource.image?.url
            ? getEmbedlyUrl(resource, size)
            : DEFAULT_RESOURCE_IMG
        }
        alt={resource.image?.alt ?? ""}
      />
      <Card.Info>
        <Info resource={resource} />
      </Card.Info>
      <Card.Title>
        <EllipsisTitle lineClamp={size === "small" ? 2 : 3}>
          {resource.title}
        </EllipsisTitle>
      </Card.Title>
      <Card.Actions>
        {onAddToLearningPathClick && (
          <ActionButton
            variant="secondary"
            edge="circular"
            color="secondary"
            size="small"
            aria-label="Add to Learning Path"
            onClick={() => onAddToLearningPathClick(resource.id)}
          >
            <RiMenuAddLine />
          </ActionButton>
        )}
        {onAddToUserListClick && (
          <ActionButton
            variant="secondary"
            edge="circular"
            color="secondary"
            size="small"
            aria-label="Add to User List"
            onClick={() => onAddToUserListClick(resource.id)}
          >
            <RiBookmarkLine />
          </ActionButton>
        )}
      </Card.Actions>
      <Card.Footer>
        <StartDate resource={resource} size={size} />
      </Card.Footer>
    </Card>
  )
}

export { LearningResourceCard }
