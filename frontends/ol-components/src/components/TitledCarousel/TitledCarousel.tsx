import React, { ElementType, useCallback, useRef, useState } from "react"
import Carousel from "nuka-carousel"
import { clamp } from "lodash"
import type { CarouselProps } from "nuka-carousel"
import styled from "@emotion/styled"
import { theme } from "../ThemeProvider/ThemeProvider"

type TitledCarouselProps = {
  children: React.ReactNode
  title?: React.ReactNode
  as?: ElementType
  className?: string
  headerClassName?: string
  pageSize: number
  /**
   * Animation duration in milliseconds.
   */
  animationDuration?: number
  cellSpacing?: CarouselProps["cellSpacing"]
  /**
   * React element to use as "Previous Page" button.
   *
   * @note Internally, the element will be cloned and props `disabled` and
   * `onClick` will be added.
   */
  previous?: React.ReactElement
  /**
   * React element to use as "Next Page" button.
   *
   * @note Internally, the element will be cloned and props `disabled` and
   * `onClick` will be added.
   */
  next?: React.ReactElement

  showNavigationButtons?: boolean
}

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const CAROUSEL_SPACING = 24

const StyledCarousel = styled(Carousel)({
  paddingTop: theme.custom.shadowOverflowTop,
  paddingBottom: theme.custom.shadowOverflowBottom,

  /*
    We want the carousel cards to:
      1. be spaced
      2. cast a shadow when hovered
      3. be left-aligned (left edge of left-most card aligned with rest of page content)

    The card container has `overflow: hidden` to prevent seeing the offscreen
    cards. Consequently, if the leftmost card is at the left edge of the carousel
    container, then its shadow gets cut off and looks weird.

    So instead: keep a margin on the left-most card, but translate the whole
    carousel leftwards by the same margin. This keeps stuff spaced and makes the
    shadows look nice.

    Caveat: This is not a good solution if there is content within $carouselSpacing
    of the carousel's left edge. But...there's not.
    */
  transform: `translateX(-${CAROUSEL_SPACING}px * 0.5)`,

  /*
    We also want the carousel contents (cards) to appear as if they are full
    width. By default, the width is 100% and since there's cell-spacing, the
    right-most card does not line up with the right-hand margin, it's short by
    half the spacing.

    But since we also translated the contents leftwards (see above) we're actually
    off by a full cellSpacing.

    This needs to be !important because Nuke Carousel applies width: 100% as an
    inline style.
    */
  width: `calc(100% + #{${CAROUSEL_SPACING}px}) !important`,
})

const defaultAnimationDuration = 800

const TitledCarousel = ({
  children,
  title,
  className,
  headerClassName,
  pageSize,
  cellSpacing,
  animationDuration = defaultAnimationDuration,
  as: ContainerComponent = "div",
  previous = <button>Previous</button>,
  next = <button>Next</button>,
  showNavigationButtons = true,
}: TitledCarouselProps): React.ReactNode => {
  const wasButtonChange = useRef(false)
  const [index, setIndex] = useState(0)
  const childCount = React.Children.count(children)
  const canPageUp = index + pageSize < childCount
  const canPageDown = index !== 0

  const pageDown = useCallback(() => {
    setIndex((currentIndex) =>
      clamp(currentIndex - pageSize, 0, childCount - 1),
    )
    wasButtonChange.current = true
  }, [pageSize, childCount])
  const pageUp = useCallback(() => {
    setIndex((currentIndex) =>
      clamp(currentIndex + pageSize, 0, childCount - 1),
    )
    wasButtonChange.current = true
  }, [pageSize, childCount])
  const syncIndexFromDrag = useCallback((sliderIndex: number) => {
    if (!wasButtonChange.current) {
      /**
       * This was a drag change, so we need to manually sync the index with our
       * state.
       */
      setIndex(sliderIndex)
    }
    wasButtonChange.current = false
  }, [])

  return (
    <ContainerComponent className={className}>
      <HeaderContainer className={headerClassName}>
        {title}
        {showNavigationButtons && (
          <ButtonsContainer>
            {React.cloneElement(previous, {
              disabled: !canPageDown,
              onClick: pageDown,
            })}
            {React.cloneElement(next, {
              disabled: !canPageUp,
              onClick: pageUp,
            })}
          </ButtonsContainer>
        )}
      </HeaderContainer>
      <StyledCarousel
        slideIndex={index}
        slidesToShow={pageSize}
        afterSlide={syncIndexFromDrag}
        cellSpacing={cellSpacing}
        withoutControls={true}
        speed={animationDuration}
      >
        {children}
      </StyledCarousel>
    </ContainerComponent>
  )
}

export { TitledCarousel }
export type { TitledCarouselProps }
