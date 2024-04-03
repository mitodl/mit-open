import React, { ElementType, useCallback, useState } from "react"
import NukaCarousel from "nuka-carousel"
import { clamp } from "lodash"
import type { CarouselProps as NukaCarouselProps } from "nuka-carousel"
import styled from "@emotion/styled"
import NavigateNextIcon from "@mui/icons-material/NavigateNext"
import { FilledIconButton } from "../FilledIconButton/FilledIconButton"
import Stack from "@mui/material/Stack"

type CarouselProps = {
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
  cellSpacing?: NukaCarouselProps["cellSpacing"]
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

const CAROUSEL_SPACING = 24

const NukaCarouselStyled = styled(NukaCarousel)({
  /*
    We want the carousel cards to:
      1. be spaced,
      2. have shadows (possibly), and
      3. be left-aligned (left edge of left-most card aligned with rest of page content)

    The card container has `overflow: hidden` to prevent seeing the offscreen
    cards. Consequently, if the leftmost card is at the left edge of the carousel
    container, then its shadow gets cut off and looks weird.

    So instead:
      1. Use the default NukaCarousel behavior where there is half a cellSpacing
        of padding on the left and right of each slide
      2. translate the contents leftwards by half a cellSpacing so that they
        appear left-aligned
      3. Increase the width to 100% + cellSpacing so that the right-most card
        is right-aligned
      4. Apply positive-padding, negative-margin to the top and bottom to allow
        vertical shadows.

    NOTE: This will not work if the horizontal shadow exceeds half the
    cellspacing. In that case, the horizontal shadow will be cut off.
    */
  transform: `translateX(-${CAROUSEL_SPACING * 0.5}px)`,
  width: `calc(100% + ${CAROUSEL_SPACING}px) !important`,
  /**
   * These values are a bit arbitrary. They just need to exceed the vertical
   * shadow.
   */
  paddingBottom: "6px",
  marginBottom: "-6px",
  paddingTop: "6px",
  marginTop: "-6px",
})

const defaultAnimationDuration = 800

const Carousel: React.FC<CarouselProps> = ({
  children,
  className,
  pageSize,
  animationDuration = defaultAnimationDuration,
  as: ContainerComponent = "div",
}) => {
  const [index, setIndex] = useState(0)
  const childCount = React.Children.count(children)
  const canPageUp = index + pageSize < childCount
  const canPageDown = index !== 0

  const pageDown = useCallback(() => {
    setIndex((currentIndex) =>
      clamp(currentIndex - pageSize, 0, childCount - 1),
    )
  }, [pageSize, childCount])
  const pageUp = useCallback(() => {
    setIndex((currentIndex) =>
      clamp(currentIndex + pageSize, 0, childCount - 1),
    )
  }, [pageSize, childCount])
  const handleBeforeSlide: NonNullable<NukaCarouselProps["beforeSlide"]> =
    useCallback((_currentIndex, endIndex) => {
      setIndex(endIndex)
    }, [])

  return (
    <ContainerComponent id="hello" className={className}>
      <NukaCarouselStyled
        slideIndex={index}
        slidesToShow={pageSize}
        beforeSlide={handleBeforeSlide}
        withoutControls={true}
        cellSpacing={CAROUSEL_SPACING}
        speed={animationDuration}
      >
        {children}
      </NukaCarouselStyled>
      <Stack flexDirection="row" justifyContent="end" gap={3}>
        <FilledIconButton
          variant="contained"
          onClick={pageDown}
          disabled={!canPageDown}
        >
          <NavigateNextIcon fontSize="large" />
        </FilledIconButton>
        <FilledIconButton
          variant="contained"
          onClick={pageUp}
          disabled={!canPageUp}
        >
          <NavigateNextIcon fontSize="large" />
        </FilledIconButton>
      </Stack>
    </ContainerComponent>
  )
}

export { Carousel as TitledCarousel }
export type { CarouselProps as TitledCarouselProps }
