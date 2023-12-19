import React, { useCallback } from "react"
import Dotdotdot from "react-dotdotdot"
import invariant from "tiny-invariant"
import { toQueryString, pluralize } from "ol-utilities"
import classNames from "classnames"
import { Card, CardContent, Chip, CardMedia } from "ol-components"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"

import {
  CardMinimalResource,
  EmbedlyConfigLegacy,
  LearningResourceType,
  TYPE_FAVORITES,
} from "ol-common"
import {
  findBestRunLegacy,
  getReadableResourceTypeLegacy,
  getStartDate,
  resourceThumbnailSrcLegacy,
  CertificateIcon,
} from "ol-utilities/deprecated"

type CardVariant = "column" | "row" | "row-reverse"
type OnActivateCard<R extends CardMinimalResource = CardMinimalResource> = (
  resource: R,
) => void
type LearningResourceCardTemplateLegacyProps<
  R extends CardMinimalResource = CardMinimalResource,
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
  imgConfig: EmbedlyConfigLegacy
  onActivate?: OnActivateCard<R>
  /**
   * Suppress the image.
   */
  suppressImage?: boolean
  footerActionSlot?: React.ReactNode
}

type OffererProps = {
  offerer: string
}

const Offerer: React.FC<OffererProps> = ({ offerer }) => {
  return offerer ? (
    <React.Fragment key={`${offerer}`}>
      <a href={`/infinite/search?${toQueryString({ o: offerer })}`}>
        {offerer}
      </a>
    </React.Fragment>
  ) : null
}

const CardBody: React.FC<
  Pick<LearningResourceCardTemplateLegacyProps, "resource">
> = ({ resource }) => {
  const offerer = resource.offered_by ?? null
  return offerer ? (
    <div>
      <span className="ol-lrc-offered-by">Offered by &ndash;</span>
      <Offerer offerer={offerer} />
    </div>
  ) : null
}

const ResourceFooterDetails: React.FC<
  Pick<LearningResourceCardTemplateLegacyProps, "resource">
> = ({ resource }) => {
  const isList = [
    LearningResourceType.Userlist,
    LearningResourceType.LearningPath,
    LearningResourceType.StaffList,
    LearningResourceType.StaffPath,
    TYPE_FAVORITES,
  ].includes(resource.object_type)
  if (isList && resource.item_count !== undefined) {
    return (
      <span>
        {resource.item_count} {pluralize("item", resource.item_count)}
      </span>
    )
  }

  const bestAvailableRun = findBestRunLegacy(resource.runs ?? [])
  const hasCertificate =
    resource.certification && resource.certification.length > 0
  const startDate =
    hasCertificate && bestAvailableRun
      ? getStartDate(resource.platform ?? "", bestAvailableRun)
      : null
  if (startDate) {
    return (
      <Chip
        className="ol-lrc-chip"
        avatar={<CalendarTodayIcon />}
        label={startDate}
      />
    )
  }

  return null
}

type LRCImageProps = Pick<
  LearningResourceCardTemplateLegacyProps,
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
      src={resourceThumbnailSrcLegacy(resource, imgConfig)}
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
const LearningResourceCardTemplateLegacy = <R extends CardMinimalResource>({
  variant,
  resource,
  imgConfig,
  className,
  suppressImage = false,
  onActivate,
  footerActionSlot,
  sortable,
}: LearningResourceCardTemplateLegacyProps<R>) => {
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
    <Card className={classNames(className, "ol-lrc-root-old")}>
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
              {getReadableResourceTypeLegacy(resource.object_type)}
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

export default LearningResourceCardTemplateLegacy

export type {
  LearningResourceCardTemplateLegacyProps,
  CardMinimalResource,
  CardVariant,
  OnActivateCard,
}
