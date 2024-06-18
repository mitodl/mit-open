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
  pluralize,
} from "ol-utilities"
import { ListCard } from "../Card/ListCard"
import { ActionButton } from "../Button/Button"
import { theme } from "../ThemeProvider/ThemeProvider"
import { useMuiBreakpointAtLeast } from "../../hooks/useBreakpoint"

const IMAGE_SIZES = {
  mobile: { width: 116, height: 104 },
  desktop: { width: 236, height: 122 },
}

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

const getEmbedlyUrl = (url: string, isMobile: boolean) => {
  return embedlyCroppedImage(url, {
    key: APP_SETTINGS.embedlyKey || process.env.EMBEDLY_KEY!,
    ...IMAGE_SIZES[isMobile ? "mobile" : "desktop"],
  })
}

type Prices = {
  course: null | number
  certificate: null | number
}

const getPrices = (resource: LearningResource) => {
  const prices: Prices = {
    course: null,
    certificate: null,
  }

  if (!resource) {
    return prices
  }

  const resourcePrices = resource.prices.map((price) => Number(price)).sort()

  if (resourcePrices.length > 1) {
    /* The resource is free and offers a paid certificate option, e.g.
     * { prices: [0, 49], free: true, certification: true }
     */
    if (resource.certification && resource.free) {
      const certificatedPrices = resourcePrices.filter((price) => price > 0)
      return {
        course: 0,
        certificate:
          certificatedPrices.length === 1
            ? certificatedPrices[0]
            : [
                certificatedPrices[0],
                certificatedPrices[certificatedPrices.length - 1],
              ],
      }
    }

    /* The resource is not free and has a range of prices, e.g.
     * { prices: [950, 999], free: false, certification: true|false }
     */
    if (resource.certification && !resource.free && Number(resourcePrices[0])) {
      return {
        course: [resourcePrices[0], resourcePrices[resourcePrices.length - 1]],
        certificate: null,
      }
    }

    /* The resource is not free but has a zero price option (prices not ingested correctly)
     * { prices: [0, 999], free: false, certification: true|false }
     */
    if (!resource.free && !Number(resourcePrices[0])) {
      return {
        course: +Infinity,
        certificate: null,
      }
    }

    /* We are not expecting multiple prices for courses with no certificate option.
     * For resourses always certificated, there is one price that includes the certificate.
     */
  } else if (resourcePrices.length === 1) {
    if (!Number(resourcePrices[0])) {
      /* Sometimes price info is missing, but the free flag is reliable.
       */
      if (!resource.free) {
        return {
          course: +Infinity,
          certificate: null,
        }
      }

      return {
        course: 0,
        certificate: null,
      }
    } else {
      /* If the course has no free option, the price of the certificate
       * is included in the price of the course.
       */
      return {
        course: Number(resourcePrices[0]),
        certificate: null,
      }
    }
  } else if (resourcePrices.length === 0) {
    return {
      course: resource.free ? 0 : +Infinity,
      certificate: null,
    }
  }

  return prices
}

const getDisplayPrecision = (price: number) => {
  if (Number.isInteger(price)) {
    return price.toFixed(0)
  }
  return price.toFixed(2)
}

const getDisplayPrice = (price: number | number[] | null) => {
  if (price === null) {
    return null
  }
  if (price === 0) {
    return "Free"
  }
  if (price === +Infinity) {
    return "Paid"
  }
  if (Array.isArray(price)) {
    return `$${getDisplayPrecision(price[0])} - $${getDisplayPrecision(price[1])}`
  }
  return `$${getDisplayPrecision(price)}`
}

/* This displays a single price for courses with no free option
 * (price includes the certificate). For free courses with the
 * option of a paid certificate, the certificate price displayed
 * in the certificate badge alongside the course "Free" price.
 */
const Info = ({ resource }: { resource: LearningResource }) => {
  const prices = getPrices(resource)
  getDisplayPrice(+Infinity)
  return (
    <>
      <span>{getReadableResourceType(resource.resource_type)}</span>
      {resource.certification && (
        <Certificate>
          <RiAwardFill />
          Certificate{prices?.certificate ? ":" : ""}{" "}
          {getDisplayPrice(prices?.certificate)}
        </Certificate>
      )}
      <Price>{getDisplayPrice(prices?.course)}</Price>
    </>
  )
}

const Count = ({ resource }: { resource: LearningResource }) => {
  if (resource.resource_type !== ResourceTypeEnum.LearningPath) {
    return null
  }
  const count = resource.learning_path.item_count
  return (
    <div>
      <span>{count}</span> {pluralize("item", count)}
    </div>
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

const StartDate: React.FC<{ resource: LearningResource }> = ({ resource }) => {
  const startDate = getStartDate(resource)

  if (!startDate) return null

  const label = isOcw(resource) ? "As taught in:" : "Starts:"

  return (
    <div>
      {label} <span>{startDate}</span>
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
          style={{ marginBottom: isMobile ? 16 : 51 }}
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
  href?: string
  onAddToLearningPathClick?: ResourceIdCallback | null
  onAddToUserListClick?: ResourceIdCallback | null
  editMenu?: React.ReactNode | null
}

const LearningResourceListCard: React.FC<LearningResourceListCardProps> = ({
  isLoading,
  resource,
  className,
  href,
  onAddToLearningPathClick,
  onAddToUserListClick,
  editMenu,
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
    <ListCard href={href} className={className}>
      <ListCard.Image
        src={
          resource.image?.url
            ? getEmbedlyUrl(resource.image.url!, isMobile)
            : DEFAULT_RESOURCE_IMG
        }
        alt={resource.image?.alt ?? ""}
      />
      <ListCard.Info>
        <Info resource={resource} />
      </ListCard.Info>
      <ListCard.Title>{resource.title}</ListCard.Title>
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
        {editMenu}
      </ListCard.Actions>
      <ListCard.Footer>
        <BorderSeparator>
          <Count resource={resource} />
          <StartDate resource={resource} />
          <Format resource={resource} />
        </BorderSeparator>
      </ListCard.Footer>
    </ListCard>
  )
}

export { LearningResourceListCard }
