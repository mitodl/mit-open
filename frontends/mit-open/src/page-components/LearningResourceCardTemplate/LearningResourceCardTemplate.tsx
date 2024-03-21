import React, { useCallback } from "react"
import invariant from "tiny-invariant"
import { ResourceTypeEnum, type LearningResource } from "api"
import { Chip, CardMedia, styled } from "ol-components"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import {
  formatDate,
  pluralize,
  resourceThumbnailSrc,
  getReadableResourceType,
  findBestRun,
} from "ol-utilities"
import type { EmbedlyConfig } from "ol-utilities"
import CardTemplate from "../CardTemplate/CardTemplate"

type CardVariant = "column" | "row" | "row-reverse"
type OnActivateCard<R extends LearningResource> = (resource: R) => void
type LearningResourceCardTemplateProps<
  R extends LearningResource = LearningResource,
> = {
  /**
   * Whether the course picture and info display as a column or row.
   */
  variant: CardVariant
  resource: R
  sortable?: boolean
  className?: string
  /**
   * Config used to generate embedly urls.
   */
  imgConfig: EmbedlyConfig
  onActivate?: OnActivateCard<R>
  /**
   * Suppress the image.
   */
  suppressImage?: boolean
  footerActionSlot?: React.ReactNode
}

const LIGHT_TEXT_COLOR = "#8c8c8c"
const SMALL_FONT_SIZE = 0.75

const CalendarChip = styled(Chip)({
  height: `${2.5 * SMALL_FONT_SIZE}em`,
  fontSize: `${SMALL_FONT_SIZE}em`,

  ".MuiSvgIcon-root": {
    height: `${1.25 * SMALL_FONT_SIZE}em`,
    width: `${1.25 * SMALL_FONT_SIZE}em`,
  },
})

const ResourceFooterDetails: React.FC<
  Pick<LearningResourceCardTemplateProps, "resource">
> = ({ resource }) => {
  if (resource.resource_type === ResourceTypeEnum.LearningPath) {
    const count = resource.learning_path.item_count
    return (
      <span>
        {count} {pluralize("item", count)}
      </span>
    )
  }

  const bestRun = findBestRun(resource.runs ?? [])
  const startDate = bestRun?.start_date

  if (!startDate) return null

  const formattedDate = formatDate(startDate, "MMMM DD, YYYY")

  return <CalendarChip avatar={<CalendarTodayIcon />} label={formattedDate} />
}

const CardMediaImage = styled(CardMedia)<{
  variant: CardVariant
  component: string
  alt: string
}>`
  ${({ variant }) =>
    variant === "row"
      ? "margin-right: 16px;"
      : variant === "row-reverse"
        ? "margin-left: 16px;"
        : ""}
`

type LRCImageProps = Pick<
  LearningResourceCardTemplateProps,
  "resource" | "imgConfig" | "suppressImage" | "variant"
>
const LRCImage: React.FC<LRCImageProps> = ({
  resource,
  imgConfig,
  suppressImage,
  variant,
}) => {
  if (suppressImage) return null
  const dims =
    variant === "column"
      ? { height: imgConfig.height }
      : { width: imgConfig.width, height: imgConfig.height }

  return (
    <CardMediaImage
      component="img"
      variant={variant}
      sx={dims}
      src={resourceThumbnailSrc(resource.image ?? null, imgConfig)}
      alt=""
    />
  )
}

const OfferedByText = styled.span`
  color: ${LIGHT_TEXT_COLOR};
  padding-right: 0.25em;
`

const CardBody: React.FC<
  Pick<LearningResourceCardTemplateProps, "resource">
> = ({ resource }) => {
  const offerer = resource.offered_by?.name ?? null
  return offerer ? (
    <div>
      <OfferedByText>Offered by &ndash;</OfferedByText>
      {offerer}
    </div>
  ) : null
}

const TypeRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  min-height: 1.5em; /* ensure consistent height even if no certificate */
`

const CertificateIcon = styled.img`
  height: 1.5em;
`
/**
 * A card display for Learning Resources. Includes a title, image, and various
 * metadata.
 *
 * This template does not provide any meaningful user interaction by itself, but
 * does accept props to build user interaction (e.g., `onActivate` and
 * `footerActionSlot`).
 */
const LearningResourceCardTemplate = <R extends LearningResource>({
  variant,
  resource,
  imgConfig,
  className,
  suppressImage = false,
  onActivate,
  footerActionSlot,
  sortable = false,
}: LearningResourceCardTemplateProps<R>) => {
  const handleActivate = useCallback(
    () => onActivate?.(resource),
    [resource, onActivate],
  )

  invariant(
    !sortable || variant === "row-reverse",
    "sortable only supported for variant='row-reverse'",
  )

  const image = (
    <LRCImage
      variant={variant}
      suppressImage={suppressImage}
      resource={resource}
      imgConfig={imgConfig}
    />
  )
  const extraDetails = (
    <TypeRow>
      <span>{getReadableResourceType(resource)}</span>
      {resource.certification && (
        <CertificateIcon
          alt="Receive a certificate upon completion"
          src="/static/images/certificate_icon_infinite.png"
        />
      )}
    </TypeRow>
  )
  const body = <CardBody resource={resource} />
  const footer = <ResourceFooterDetails resource={resource} />

  return (
    <CardTemplate
      variant={variant}
      className={className}
      handleActivate={handleActivate}
      extraDetails={extraDetails}
      imageSlot={image}
      title={resource.title}
      bodySlot={body}
      footerSlot={footer}
      footerActionSlot={footerActionSlot}
      sortable={sortable}
    ></CardTemplate>
  )
}

export default LearningResourceCardTemplate
export type { LearningResourceCardTemplateProps }
