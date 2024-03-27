import React from "react"
import type { LearningResource } from "api"

type ExpandedLearningResourceDisplayProps = {
  resource: LearningResource
}

const ExpandedLearningResourceDisplay: React.FC<
  ExpandedLearningResourceDisplayProps
> = ({ resource }) => {
  return (
    <div>
      <h2>{resource.title}</h2>
      <h3>{resource.resource_type}</h3>
    </div>
  )
}

export { ExpandedLearningResourceDisplay }
export type { ExpandedLearningResourceDisplayProps }
