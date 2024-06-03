import React from "react"
import { LearningResource } from "api"
import { Card } from "../Card/Card"

interface LearningResourceCardProps {
  // variant: CardVariant
  resource: LearningResource
  sortable?: boolean
  className?: string
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
}) => {
  return (
    <Card className={className}>
      <Card.Image src={resource.image?.url} alt={resource.image!.alt!} />
      <Card.Title>{resource.title}</Card.Title>
      <Card.Footer>Published: {resource.published}</Card.Footer>
    </Card>
  )
}

export { LearningResourceCard }
