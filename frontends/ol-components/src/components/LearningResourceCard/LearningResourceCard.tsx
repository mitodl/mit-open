import React from "react"
import styled from "@emotion/styled"
import Skeleton from "@mui/material/Skeleton"
import { RiMenuAddLine, RiBookmarkLine, RiAwardFill } from "@remixicon/react"
import { LearningResource, ResourceTypeEnum, PlatformEnum } from "api"
import { findBestRun, formatDate, getReadableResourceType } from "ol-utilities"
import { Card } from "../Card/Card"
import type { Size } from "../Card/Card"
import { TruncateText } from "../TruncateText/TruncateText"
import { ActionButton } from "../Button/Button"
import { imgConfigs } from "../../constants/imgConfigs"
import { theme } from "../ThemeProvider/ThemeProvider"

const EllipsisTitle = styled(TruncateText)({
  margin: 0,
})

const TitleLink = styled.a`
  display: block;
  text-align: left;

  &:hover {
    cursor: pointer;
  }
`

const SkeletonImage = styled(Skeleton)<{ aspect: number }>`
  padding-bottom: ${({ aspect }) => 100 / aspect}%;
`

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

const Title = ({
  resource,
  size,
  onActivate,
}: {
  resource: LearningResource
  size?: Size
  onActivate?: ResourceIdCallback
}) => {
  const lines = size === "small" ? 2 : 3
  return onActivate ? (
    <TitleLink onClick={() => onActivate(resource.id)} role="link">
      <EllipsisTitle lineClamp={lines}>{resource.title}</EllipsisTitle>
    </TitleLink>
  ) : (
    <EllipsisTitle lineClamp={lines}>{resource.title}</EllipsisTitle>
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

const Footer: React.FC<{ resource: LearningResource; size?: Size }> = ({
  resource,
  size,
}) => {
  const isOcw =
    resource.resource_type === ResourceTypeEnum.Course &&
    resource.platform?.code === PlatformEnum.Ocw

  let startDate = resource.next_start_date

  if (!startDate) {
    const bestRun = findBestRun(resource.runs ?? [])

    if (isOcw && bestRun?.semester && bestRun?.year) {
      return (
        <>
          {size === "medium" ? "As taught in:" : ""}{" "}
          <span>{`${bestRun?.semester} ${bestRun?.year}`}</span>
        </>
      )
    }
    startDate = bestRun?.start_date
  }

  if (!startDate) return null

  return (
    <>
      {size === "medium" ? "Starts:" : ""}{" "}
      <span>{formatDate(startDate, "MMMM DD, YYYY")}</span>
    </>
  )
}

interface LearningResourceCardProps {
  isLoading?: boolean
  resource?: LearningResource | null
  className?: string
  size?: Size
  onActivate?: ResourceIdCallback
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
      <Card.Image src={resource.image?.url} alt={resource.image!.alt!} />
      <Card.Info>
        <Info resource={resource} />
      </Card.Info>
      <Card.Title>
        <Title resource={resource} size={size} />
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
        <Footer resource={resource} size={size} />
      </Card.Footer>
    </Card>
  )
}

export { LearningResourceCard }
