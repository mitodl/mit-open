import React, { useCallback } from "react"
import Dotdotdot from "react-dotdotdot"
import invariant from "tiny-invariant"
import classNames from "classnames"
import type { LearningPathResource, LearningResource } from "api"

import { Card, CardContent, Chip, CardMedia } from "ol-design"

import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"
import moment from "moment"

import {
  resourceThumbnailSrc,
  getReadableResourceType,
  findBestRun,
} from "../utils"
import type { EmbedlyConfig } from "../utils"
import { pluralize } from "ol-util"

type CardResource = Partial<LearningResource> &
  Partial<LearningPathResource> &
  Pick<LearningResource, "id" | "resource_type" | "title">

type CardVariant = "column" | "row" | "row-reverse"
type OnActivateCard<R extends CardResource = CardResource> = (
  resource: R,
) => void
type LearningResourceCardTemplateProps<R extends CardResource = CardResource> =
  {
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

const CertificateIcon = () => (
  <img
    className="ol-lrc-cert"
    alt="Receive a certificate upon completion"
    src="/static/images/certificate_icon_infinite.png"
  />
)

const CardBody: React.FC<
  Pick<LearningResourceCardTemplateProps, "resource">
> = ({ resource }) => {
  const offerer = resource.offered_by?.name ?? null
  return offerer ? (
    <div>
      <span className="ol-lrc-offered-by">Offered by &ndash;</span>
      {offerer}
    </div>
  ) : null
}

const ResourceFooterDetails: React.FC<
  Pick<LearningResourceCardTemplateProps, "resource">
> = ({ resource }) => {
  const bestRun = findBestRun(resource.runs ?? [])
  const startDate = bestRun?.start_date
  const formattedDate = startDate
    ? moment(startDate).format("MMMM DD, YYYY")
    : null

  if (resource?.learning_path) {
    const count = resource.learning_path.item_count
    return (
      <span>
        {count} {pluralize("item", count)}
      </span>
    )
  }

  if (!startDate) return null

  return (
    <Chip
      className="ol-lrc-chip"
      avatar={<CalendarTodayIcon />}
      label={formattedDate}
    />
  )
}

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
    <CardMedia
      component="img"
      className="ol-lrc-image"
      sx={dims}
      src={resourceThumbnailSrc(resource.image ?? null, imgConfig)}
      alt=""
    />
  )
}

const variantClasses: Record<CardVariant, string> = {
  column: "ol-lrc-col",
  row: "ol-lrc-row",
  "row-reverse": "ol-lrc-row-reverse",
}

/**
 * A card display for Learning Resources. Includes a title, image, and various
 * metadata.
 *
 * This template does not provide any meaningful user interaction by itself, but
 * does accept props to build user interaction (e.g., `onActivate` and
 * `footerActionSlot`).
 */
const LearningResourceCardTemplate = <R extends CardResource>({
  variant,
  resource,
  imgConfig,
  className,
  suppressImage = false,
  onActivate,
  footerActionSlot,
  sortable,
}: LearningResourceCardTemplateProps<R>) => {
  const hasCertificate =
    resource.certification && resource.certification.length > 0
  const handleActivate = useCallback(
    () => onActivate?.(resource),
    [resource, onActivate],
  )

  invariant(
    !sortable || variant === "row-reverse",
    "sortable only supported for variant='row-reverse'",
  )

  return (
    <Card className={classNames(className, "ol-lrc-root")}>
      {variant === "column" ? (
        <LRCImage
          variant={variant}
          suppressImage={suppressImage}
          resource={resource}
          imgConfig={imgConfig}
        />
      ) : null}
      <CardContent
        className={classNames("ol-lrc-content", variantClasses[variant], {
          "ol-lrc-sortable": sortable,
        })}
      >
        {variant !== "column" ? (
          <LRCImage
            variant={variant}
            suppressImage={suppressImage}
            resource={resource}
            imgConfig={imgConfig}
          />
        ) : null}
        <div className="ol-lrc-details">
          <div className="ol-lrc-type-row">
            <span className="ol-lrc-type">
              {getReadableResourceType(resource)}
            </span>
            {hasCertificate && <CertificateIcon />}
          </div>
          {onActivate ? (
            <button className="clickable-title" onClick={handleActivate}>
              <Dotdotdot className="ol-lrc-title" tagName="h3" clamp={3}>
                {resource.title}
              </Dotdotdot>
            </button>
          ) : (
            <Dotdotdot className="ol-lrc-title" tagName="h3" clamp={3}>
              {resource.title}
            </Dotdotdot>
          )}
          {sortable ? null : (
            <>
              <CardBody resource={resource} />
              <div className="ol-lrc-fill-space-content-end">
                <div className="ol-lrc-footer-row">
                  <div>
                    <ResourceFooterDetails resource={resource} />
                  </div>
                  {footerActionSlot}
                </div>
              </div>
            </>
          )}
        </div>
        {sortable ? (
          <div className="ol-lrc-drag-handle">
            <DragIndicatorIcon fontSize="inherit" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default LearningResourceCardTemplate
export type { LearningResourceCardTemplateProps }
