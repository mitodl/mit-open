import React from "react"
import styled from "@emotion/styled"
import Skeleton from "@mui/material/Skeleton"
import { RiMenuAddLine, RiBookmarkLine, RiAwardFill } from "@remixicon/react"
import { LearningResource, ResourceTypeEnum, PlatformEnum } from "api"
import { findBestRun, formatDate, getReadableResourceType } from "ol-utilities"
import { Card } from "../Card/Card"
import { TruncateText } from "../TruncateText/TruncateText"
import { ActionButton } from "../Button/Button"
import { imgConfigs } from "../../constants/imgConfigs"
import { theme } from "../ThemeProvider/ThemeProvider"

const EllipsisTitle = styled(TruncateText)({
  ...theme.typography.subtitle1,
  margin: 0,
})

const TitleButton = styled.button`
  border: none;
  background-color: white;
  color: inherit;
  display: block;
  text-align: left;
  padding: 0;
  margin: 0;

  &:hover {
    text-decoration: underline;
    cursor: pointer;
  }
`

const SkeletonImage = styled(Skeleton)<{ aspect: number }>`
  padding-bottom: ${({ aspect }) => 100 / aspect}%;
`

type ResourceIdCallback = (resourceId: number) => void

const Title = ({
  resource,
  onActivate,
}: {
  resource: LearningResource
  onActivate?: ResourceIdCallback
}) => {
  return onActivate ? (
    <TitleButton onClick={() => onActivate(resource.id)}>
      <EllipsisTitle as="h3" lineClamp={3}>
        {resource.title}
      </EllipsisTitle>
    </TitleButton>
  ) : (
    <EllipsisTitle as="h3" lineClamp={3}>
      {resource.title}
    </EllipsisTitle>
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

const Footer: React.FC<{ resource: LearningResource }> = ({ resource }) => {
  const isOcw =
    resource.resource_type === ResourceTypeEnum.Course &&
    resource.platform?.code === PlatformEnum.Ocw

  let startDate = resource.next_start_date

  if (!startDate) {
    const bestRun = findBestRun(resource.runs ?? [])

    if (isOcw && bestRun?.semester && bestRun?.year) {
      return (
        <>
          As taught in: <span>{`${bestRun?.semester} ${bestRun?.year}`}</span>
        </>
      )
    }

    startDate = bestRun?.start_date
  }

  if (!startDate) return null

  return (
    <>
      Starts: <span>{formatDate(startDate, "MMMM DD, YYYY")}</span>
    </>
  )
}

interface LearningResourceCardProps {
  isLoading?: boolean
  resource?: LearningResource | null
  className?: string
  onActivate?: ResourceIdCallback
  onAddToLearningPathClick?: ResourceIdCallback | null
  onAddToUserListClick?: ResourceIdCallback | null
}

const LearningResourceCard: React.FC<LearningResourceCardProps> = ({
  isLoading,
  resource,
  className,
  onActivate,
  onAddToLearningPathClick,
  onAddToUserListClick,
}) => {
  if (isLoading) {
    const { width, height } = imgConfigs["column"]
    return (
      <Card className={className}>
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
    <Card className={className}>
      <Card.Image src={resource.image?.url} alt={resource.image!.alt!} />
      <Card.Info>
        <span>{getReadableResourceType(resource.resource_type)}</span>
        {resource.certification && (
          <Certificate>
            <RiAwardFill />
            Certificate
          </Certificate>
        )}
      </Card.Info>
      <Card.Title>
        <Title resource={resource} onActivate={onActivate} />
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
        <Footer resource={resource} />
      </Card.Footer>
    </Card>
  )
}

export { LearningResourceCard }
