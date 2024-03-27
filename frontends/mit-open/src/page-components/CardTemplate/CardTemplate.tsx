import React from "react"
import Dotdotdot from "react-dotdotdot"
import invariant from "tiny-invariant"
import { Card, CardContent, styled } from "ol-components"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"

type CardVariant = "column" | "row" | "row-reverse"
type OnActivateCard = () => void
type CardTemplateProps = {
  /**
   * Whether the course picture and info display as a column or row.
   */
  variant: CardVariant
  sortable?: boolean
  className?: string
  handleActivate?: OnActivateCard
  extraDetails?: React.ReactNode
  imageSlot?: React.ReactNode
  title?: string
  bodySlot?: React.ReactNode
  footerSlot?: React.ReactNode
  footerActionSlot?: React.ReactNode
}

const LIGHT_TEXT_COLOR = "#8c8c8c"
const SPACER = 0.75
const SMALL_FONT_SIZE = 0.75

const StyledCard = styled(Card)`
  display: flex;
  flex-direction: column;

  /* Ensure the resource image borders match card borders */
  .MuiCardMedia-root,
  > .MuiCardContent-root {
    border-radius: inherit;
  }
`

const Details = styled.div`
  /* Make content flexbox so that we can control which child fills remaining space. */
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

    &:first-of-type {
      margin-top: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
`

const StyledCardContent = styled(CardContent, {
  shouldForwardProp: (prop) => prop !== "sortable",
})<{
  variant: CardVariant
  sortable: boolean
}>`
  display: flex;
  flex-direction: ${({ variant }) => variant};
  ${({ variant }) => (variant === "column" ? "flex: 1;" : "")}
  ${({ sortable }) => (sortable ? "padding-left: 4px;" : "")}
`

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
  min-height: 2.5 * ${SMALL_FONT_SIZE}; /* ensure consistent spacing even if no date */
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const EllipsisTitle = styled(Dotdotdot)({
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

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  font-size: 40px;
  align-self: stretch;
  color: ${LIGHT_TEXT_COLOR};
  border-right: 1px solid ${LIGHT_TEXT_COLOR};
  margin-right: 16px;
`

const CardTemplate = ({
  variant,
  className,
  handleActivate,
  extraDetails,
  imageSlot,
  title,
  bodySlot,
  footerSlot,
  footerActionSlot,
  sortable = false,
}: CardTemplateProps) => {
  invariant(
    !sortable || variant === "row-reverse",
    "sortable only supported for variant='row-reverse'",
  )

  return (
    <StyledCard className={className}>
      {variant === "column" ? imageSlot : null}
      <StyledCardContent variant={variant} sortable={sortable}>
        {variant !== "column" ? imageSlot : null}
        <Details>
          {extraDetails}
          {handleActivate ? (
            <TitleButton onClick={handleActivate}>
              <EllipsisTitle tagName="h3" clamp={3}>
                {title}
              </EllipsisTitle>
            </TitleButton>
          ) : (
            <EllipsisTitle tagName="h3" clamp={3}>
              {title}
            </EllipsisTitle>
          )}
          {sortable ? null : (
            <>
              {bodySlot}
              <FillSpaceContentEnd>
                <FooterRow>
                  <div>{footerSlot}</div>
                  {footerActionSlot}
                </FooterRow>
              </FillSpaceContentEnd>
            </>
          )}
        </Details>
        {sortable ? (
          <DragHandle>
            <DragIndicatorIcon fontSize="inherit" />
          </DragHandle>
        ) : null}
      </StyledCardContent>
    </StyledCard>
  )
}

export default CardTemplate
export type { CardTemplateProps }
