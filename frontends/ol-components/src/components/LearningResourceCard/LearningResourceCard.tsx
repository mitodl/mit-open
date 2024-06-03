import React from "react"
import styled from "@emotion/styled"
import { LearningResource } from "api"
import { Card } from "../Card/Card"
import { TruncateText } from "../TruncateText/TruncateText"

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

interface LearningResourceCardProps {
  // variant: CardVariant
  resource: LearningResource
  sortable?: boolean
  className?: string

  openLearningResourceDrawer: ResourceIdCallback
  showAddToLearningPathDialog?: ResourceIdCallback
  showAddToUserListDialog?: ResourceIdCallback
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
  openLearningResourceDrawer,
  // showAddToLearningPathDialog,
  // showAddToUserListDialog,
}) => {
  return (
    <Card className={className}>
      <Card.Image src={resource.image?.url} alt={resource.image!.alt!} />
      <Card.Title>
        <Title resource={resource} onActivate={openLearningResourceDrawer} />
      </Card.Title>
      <Card.Footer>Published: {resource.published}</Card.Footer>
    </Card>
  )
}

export { LearningResourceCard }
