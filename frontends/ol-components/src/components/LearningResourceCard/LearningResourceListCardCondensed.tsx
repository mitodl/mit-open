import React from "react"
import styled from "@emotion/styled"
import Skeleton from "@mui/material/Skeleton"
import {
  RiMenuAddLine,
  RiBookmarkLine,
  RiAwardFill,
  RiBookmarkFill,
} from "@remixicon/react"
import { LearningResource } from "api"
import {
  getReadableResourceType,
  getLearningResourcePrices,
} from "ol-utilities"
import { ListCardCondensed } from "../Card/ListCardCondensed"
import { useMuiBreakpointAtLeast } from "../../hooks/useBreakpoint"
import {
  Certificate,
  Price,
  BorderSeparator,
  Count,
  StartDate,
  Format,
} from "./LearningResourceListCard"
import type { LearningResourceListCardProps } from "./LearningResourceListCard"
import { ActionButton, ActionButtonProps } from "../Button/Button"

const ResourceType = styled.span`
  align-self: flex-start;
`

/* The only variation on the LearningResourceListCard
 * Info is the ResourceType flex alignment
 */
const Info = ({ resource }: { resource: LearningResource }) => {
  const prices = getLearningResourcePrices(resource)
  return (
    <>
      <ResourceType>
        {getReadableResourceType(resource.resource_type)}
      </ResourceType>
      {resource.certification && (
        <Certificate>
          <RiAwardFill />
          Certificate{prices?.certificate ? ":" : ""}{" "}
          {prices.displayCertificate}
        </Certificate>
      )}
      <Price>{prices.displayCourse}</Price>
    </>
  )
}

const Loading = styled.div<{ mobile?: boolean }>`
  padding: 16px;
`

const LoadingView = ({ isMobile }: { isMobile: boolean }) => {
  return (
    <Loading mobile={isMobile}>
      <Skeleton variant="text" width="6%" />
      <Skeleton variant="text" width="60%" style={{ marginBottom: 8 }} />
      <Skeleton variant="text" width="20%" />
    </Loading>
  )
}

type CardActionButtonProps = Pick<
  ActionButtonProps,
  "aria-label" | "onClick" | "children"
> & {
  filled?: boolean
}

export const CardActionButton: React.FC<CardActionButtonProps> = ({
  filled,
  ...props
}) => {
  const FILLED_PROPS = { variant: "primary" } as const
  const UNFILLED_PROPS = { color: "secondary", variant: "secondary" } as const

  return (
    <ActionButton
      edge="circular"
      size="small"
      {...(filled ? FILLED_PROPS : UNFILLED_PROPS)}
      {...props}
    />
  )
}

const LearningResourceListCardCondensed: React.FC<
  LearningResourceListCardProps
> = ({
  isLoading,
  resource,
  className,
  href,
  onAddToLearningPathClick,
  onAddToUserListClick,
  editMenu,
  inLearningPath,
  inUserList,
  draggable,
}) => {
  const isMobile = !useMuiBreakpointAtLeast("md")

  if (isLoading) {
    return (
      <ListCardCondensed className={className}>
        <ListCardCondensed.Content>
          <LoadingView isMobile={isMobile} />
        </ListCardCondensed.Content>
      </ListCardCondensed>
    )
  }
  if (!resource) {
    return null
  }
  return (
    <ListCardCondensed href={href} className={className} draggable={draggable}>
      <ListCardCondensed.Info>
        <Info resource={resource} />
      </ListCardCondensed.Info>
      <ListCardCondensed.Title>{resource.title}</ListCardCondensed.Title>
      <ListCardCondensed.Actions>
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
        {editMenu}
      </ListCardCondensed.Actions>
      <ListCardCondensed.Footer>
        <BorderSeparator>
          <Count resource={resource} />
          <StartDate resource={resource} />
          <Format resource={resource} />
        </BorderSeparator>
      </ListCardCondensed.Footer>
    </ListCardCondensed>
  )
}

export { LearningResourceListCardCondensed }
export type { LearningResourceListCardProps as LearningResourceListCardCondensedProps }
