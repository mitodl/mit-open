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
} from "ol-utilities"
import { ListCard } from "../Card/ListCard"
import type { Size } from "../Card/ListCard"
import { TruncateText } from "../TruncateText/TruncateText"
import { ActionButton } from "../Button/Button"
import { theme } from "../ThemeProvider/ThemeProvider"
import { useMuiBreakpointAtLeast } from "../../hooks/useBreakpoint"

const IMAGE_SIZES = {
  mobile: { width: 116, height: 104 },
  desktop: { width: 236, height: 122 },
}

const EllipsisTitle = styled(TruncateText)({
  margin: 0,
})

const Certificate = styled.div`
  border-radius: 4px;
  background-color: ${theme.custom.colors.lightGray1};
  padding: 4px;
  color: ${theme.custom.colors.silverGrayDark};
  gap: 4px;
  margin: 0 8px 0 auto;

  ${{ ...theme.typography.subtitle3 }}

  svg {
    width: 16px;
    height: 16px;
  }

  ${theme.breakpoints.down("md")} {
    ${{ ...theme.typography.body4 }}
    background: none;
    color: ${theme.custom.colors.darkGray2};
    gap: 2px;

    svg {
      width: 12px;
      height: 12px;
      fill: ${theme.custom.colors.silverGrayDark};
    }
    margin: 0 12px 0 auto;
  }

  display: flex;
  align-items: center;
`

const Price = styled.div`
  ${{ ...theme.typography.subtitle2 }}
  color: ${theme.custom.colors.darkGray2};
  ${theme.breakpoints.down("md")} {
    ${{ ...theme.typography.subtitle3 }}
    color: ${theme.custom.colors.mitRed};
  }
`

const BorderSeparator = styled.div`
  div {
    display: inline;
  }
  div + div {
    margin-left: 8px;
    padding-left: 8px;
    border-left: 1px solid ${theme.custom.colors.lightGray2};
  }
`

const StyledActionButton = styled(ActionButton)<{ edge: string }>`
  ${({ edge }) =>
    edge === "none"
      ? `
  width: 16px;
  height: 16px;`
      : ""}
`

type ResourceIdCallback = (resourceId: number) => void

const getEmbedlyUrl = (resource: LearningResource, isMobile: boolean) => {
  return resource?.image?.url
    ? embedlyCroppedImage(resource?.image?.url, {
        key: APP_SETTINGS.embedlyKey,
        ...IMAGE_SIZES[isMobile ? "mobile" : "desktop"],
      })
    : null
}

const getPrice = (resource: LearningResource) => {
  if (!resource) {
    return null
  }
  const price = resource.prices?.[0]
  if (resource.platform?.code === PlatformEnum.Ocw || price === 0) {
    return "Free"
  }
  return price ? `$${price}` : null
}

const Info = ({ resource }: { resource: LearningResource }) => {
  const price = getPrice(resource)
  return (
    <>
      <span>{getReadableResourceType(resource.resource_type)}</span>
      {resource.certification && (
        <Certificate>
          <RiAwardFill />
          Certificate
        </Certificate>
      )}
      {price && <Price>{price}</Price>}
    </>
  )
}

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
    <div>
      {label} <span>{formatDate(startDate, "MMMM DD, YYYY")}</span>
    </div>
  )
}

const Format = ({ resource }: { resource: LearningResource }) => {
  const format = resource.learning_format?.[0]?.name
  if (!format) return null
  return (
    <div>
      Format: <span>{format}</span>
    </div>
  )
}

const Loading = styled.div<{ mobile?: boolean }>`
  display: flex;
  padding: 24px;
  justify-content: space-between;
  > div {
    width: calc(100% - 236px);
  }
  > span {
    flex-grow: 0;
    margin-left: auto;
  }
  ${({ mobile }) =>
    mobile
      ? `
    padding: 0px;
    > div {
      padding: 12px;
    }`
      : ""}
`

const LoadingView = ({ isMobile }: { isMobile: boolean }) => {
  const { width, height } = IMAGE_SIZES[isMobile ? "mobile" : "desktop"]
  return (
    <Loading mobile={isMobile}>
      <div>
        <Skeleton
          variant="text"
          width="15%"
          style={{ marginBottom: isMobile ? 4 : 10 }}
        />
        <Skeleton
          variant="text"
          width="75%"
          style={{ marginBottom: isMobile ? 32 : 51 }}
        />
        <Skeleton variant="text" width="20%" />
      </div>
      <Skeleton
        variant="rectangular"
        width={width}
        height={height}
        style={{ borderRadius: 4 }}
      />
    </Loading>
  )
}

interface LearningResourceListCardProps {
  isLoading?: boolean
  resource?: LearningResource | null
  className?: string
  onAddToLearningPathClick?: ResourceIdCallback | null
  onAddToUserListClick?: ResourceIdCallback | null
}

const LearningResourceListCard: React.FC<LearningResourceListCardProps> = ({
  isLoading,
  resource,
  className,
  onAddToLearningPathClick,
  onAddToUserListClick,
}) => {
  const isMobile = !useMuiBreakpointAtLeast("md")

  if (isLoading) {
    return (
      <ListCard className={className}>
        <ListCard.Content>
          <LoadingView isMobile={isMobile} />
        </ListCard.Content>
      </ListCard>
    )
  }
  if (!resource) {
    return null
  }
  return (
    <ListCard href={`?resource=${resource.id}`} className={className}>
      {resource.image && (
        <ListCard.Image
          src={getEmbedlyUrl(resource, isMobile)!}
          alt={resource.image?.alt as string}
        />
      )}
      <ListCard.Info>
        <Info resource={resource} />
      </ListCard.Info>
      <ListCard.Title>
        <EllipsisTitle lineClamp={2}>{resource.title}</EllipsisTitle>
      </ListCard.Title>
      <ListCard.Actions>
        {onAddToLearningPathClick && (
          <StyledActionButton
            variant="secondary"
            edge={isMobile ? "none" : "circular"}
            color="secondary"
            size="small"
            aria-label="Add to Learning Path"
            onClick={() => onAddToLearningPathClick(resource.id)}
          >
            <RiMenuAddLine />
          </StyledActionButton>
        )}
        {onAddToUserListClick && (
          <StyledActionButton
            variant="secondary"
            edge={isMobile ? "none" : "circular"}
            color="secondary"
            size="small"
            aria-label="Add to User List"
            onClick={() => onAddToUserListClick(resource.id)}
          >
            <RiBookmarkLine />
          </StyledActionButton>
        )}
      </ListCard.Actions>
      <ListCard.Footer>
        <BorderSeparator>
          <StartDate resource={resource} />
          <Format resource={resource} />
        </BorderSeparator>
      </ListCard.Footer>
    </ListCard>
  )
}

export { LearningResourceListCard }
