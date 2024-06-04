import React from "react"
import styled from "@emotion/styled"
import { LearningResource, ResourceTypeEnum, PlatformEnum } from "api"
import { Card } from "../Card/Card"
import { TruncateText } from "../TruncateText/TruncateText"
import { findBestRun, formatDate } from "ol-utilities"
import { ActionButton } from "../Button/Button"
import { RiMenuAddLine, RiBookmarkLine } from "@remixicon/react"

const EllipsisTitle = styled(TruncateText)({
  fontWeight: "bold",
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
  // variant: CardVariant
  resource: LearningResource
  sortable?: boolean
  className?: string

  onActivate: ResourceIdCallback
  onAddToLearningPathClick?: ResourceIdCallback | null
  onAddToUserListClick?: ResourceIdCallback | null
  // /**
  //  * Config used to generate embedly urls.
  //  */
  // imgConfig: EmbedlyConfig
  // onActivate?: OnActivateCard<R>
  // /**
  //  * Suppress the image.
  //  */
  // suppressImage?: boolean
  // footerActionSlot?: React.ReactNode
}

const LearningResourceCard: React.FC<LearningResourceCardProps> = ({
  resource,
  className,
  onActivate,
  onAddToLearningPathClick,
  onAddToUserListClick,
}) => {
  return (
    <Card className={className}>
      <Card.Image src={resource.image?.url} alt={resource.image!.alt!} />
      <Card.Title>
        <Title resource={resource} onActivate={onActivate} />
      </Card.Title>
      <Card.Actions>
        {onAddToLearningPathClick && (
          <ActionButton
            variant="outlined"
            edge="rounded"
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
            variant="outlined"
            edge="rounded"
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
