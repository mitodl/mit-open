import React, { useCallback } from "react"
import Dotdotdot from "react-dotdotdot"
import invariant from "tiny-invariant"
import { ResourceTypeEnum, type LearningResource } from "api"
import { Card, CardContent, Chip, CardMedia, styled } from "ol-components"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"
import {
  formatDate,
  pluralize,
  resourceThumbnailSrc,
  getReadableResourceType,
  findBestRun,
} from "ol-utilities"
import type { EmbedlyConfig } from "ol-utilities"

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

const ResourceFooterDetails: React.FC<
  Pick<LearningResourceCardTemplateProps, "resource">
> = ({ resource }) => {
  const bestRun = findBestRun(resource.runs ?? [])
  const startDate = bestRun?.start_date
  const formattedDate = startDate
    ? formatDate(startDate, "MMMM DD, YYYY")
    : null

  if (resource.resource_type === ResourceTypeEnum.LearningPath) {
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

const LIGHT_TEXT_COLOR = "#8c8c8c"
const SPACER = 0.75
const SMALL_FONT_SIZE = "0.75em"

const StyledCard = styled(Card)`
  display: flex;
  flex-direction: column;

  // Ensure the resource image borders match card borders
  .MuiCardMedia-root,
  > .MuiCardContent-root {
    border-radius: inherit;
  }

  .ol-lrc-details {
    /*
    Make content flexbox so that we can control which child fills remaining space.
    */
    flex: 1;
    display: flex;
    flex-direction: column;

    > * {
      /*
      Flexbox doesn't have collapsing margins, so we need to avoid double spacing.
      The column-gap property would be a nicer solution, but it doesn't have the
      best browser support yet.
      */
      margin-top: ${SPACER / 2}rem;
      margin-bottom: ${SPACER / 2}rem;

      &:first-child {
        margin-top: 0;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .ol-lrc-chip.MuiChip-root {
    height: 2.5 * ${SMALL_FONT_SIZE};
    font-size: ${SMALL_FONT_SIZE};

    .MuiSvgIcon-root {
      height: 1.25 * ${SMALL_FONT_SIZE};
      width: 1.25 * ${SMALL_FONT_SIZE};
    }
  }
`

const StyledCardContent = styled(CardContent)<{
  variant: CardVariant
  sortable: boolean
}>`
  display: flex;
  flex-direction: ${({ variant }) => variant};
  ${({ variant }) => (variant === "column" ? "flex: 1;" : "")}
  ${({ sortable }) => (sortable ? "padding-left: 4px;" : "")}
`

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

/*
  Last child of ol-lrc-content will take up any extra space (flex: 1) but
  with its contents at the bottom of its box.
  The default is stretch, we we do not want.
*/
const FillSpaceContentEnd = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
`

const FooterRow = styled.div`
  min-height: 2.5 * ${SMALL_FONT_SIZE}; // ensure consistent spacing even if no date
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const TypeRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  min-height: 1.5em; // ensure consistent height even if no certificate
`

const EllipsisTitle = styled(Dotdotdot)`
  font-weight: bold !default;
  margin: 0;
`

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

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  font-size: 40px;
  align-self: stretch;
  color: ${LIGHT_TEXT_COLOR};
  border-right: 1px solid ${LIGHT_TEXT_COLOR};
  margin-right: 16px;
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

  return (
    <StyledCard className={className}>
      {variant === "column" ? (
        <LRCImage
          variant={variant}
          suppressImage={suppressImage}
          resource={resource}
          imgConfig={imgConfig}
        />
      ) : null}
      <StyledCardContent variant={variant} sortable={sortable}>
        {variant !== "column" ? (
          <LRCImage
            variant={variant}
            suppressImage={suppressImage}
            resource={resource}
            imgConfig={imgConfig}
          />
        ) : null}
        <div className="ol-lrc-details">
          <TypeRow>
            <span>{getReadableResourceType(resource)}</span>
            {resource.certification && (
              <CertificateIcon
                alt="Receive a certificate upon completion"
                src="/static/images/certificate_icon_infinite.png"
              />
            )}
          </TypeRow>
          {onActivate ? (
            <TitleButton onClick={handleActivate}>
              <EllipsisTitle tagName="h3" clamp={3}>
                {resource.title}
              </EllipsisTitle>
            </TitleButton>
          ) : (
            <EllipsisTitle tagName="h3" clamp={3}>
              {resource.title}
            </EllipsisTitle>
          )}
          {sortable ? null : (
            <>
              <CardBody resource={resource} />
              <FillSpaceContentEnd>
                <FooterRow>
                  <div>
                    <ResourceFooterDetails resource={resource} />
                  </div>
                  {footerActionSlot}
                </FooterRow>
              </FillSpaceContentEnd>
            </>
          )}
        </div>
        {sortable ? (
          <DragHandle>
            <DragIndicatorIcon fontSize="inherit" />
          </DragHandle>
        ) : null}
      </StyledCardContent>
    </StyledCard>
  )
}

export default LearningResourceCardTemplate
export type { LearningResourceCardTemplateProps }
