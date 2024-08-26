import React, { useCallback } from "react"
import { createPortal } from "react-dom"
import Slick from "react-slick"
import { onReInitSlickA11y } from "./util"
import { ActionButton } from "../Button/Button"
import { RiArrowRightLine, RiArrowLeftLine } from "@remixicon/react"
import styled from "@emotion/styled"

type CarouselProps = {
  children: React.ReactNode
  className?: string
  initialSlide?: number
  /**
   * Animation duration in milliseconds.
   */
  animationDuration?: number
  arrowsContainer?: HTMLElement | null
  /**
   * aria-label for the prev/next buttons container.
   * Not used if `arrowsContainer` supplied.
   * Defaults to "Slide navigation".
   */
  arrowGroupLabel?: string
  /**
   * aria-label for the previous button; defaults to "Show previous slides".
   */
  prevLabel?: string
  /**
   * aria-label for the next button; defaults to "Show next slides".
   */
  nextLabel?: string
}

const SlickStyled = styled(Slick)({
  /**
   * This is a fallback. The carousel's width should be constrained by it's
   * parent. But if it's not, this will at least prevent it from resizing itself
   * beyond the viewport width.
   */
  maxWidth: "100vw",
})

/**
 * Return the current slide and the sliders per paged, based on current element
 * rectangles.
 */
export const getSlideInfo = (
  container: HTMLElement,
): {
  currentIndex: number | undefined
  slidesPerPage: number | undefined
} => {
  /**
   * NOTE:
   * The calculation of `slidesPerPage` is based on the assumption that:
   * - slides are fixed-width
   * - gaps between slides are consistent
   *
   * With this assumption, a perfect fit would be:
   * containerWidth = slidesPerPage * slideWidth + (slidesPerPage - 1) * gap
   * Or, in other words:
   * slidersPerPage = (containerWidth + gap) / (slideWidth + gap)
   */
  const current = container.querySelector<HTMLElement>(".slick-current")
  const slides = container.querySelectorAll<HTMLElement>(".slick-slide")
  if (!current) {
    return { currentIndex: undefined, slidesPerPage: undefined }
  }
  const currentIndex = Number(current.dataset.index)
  const adjacent = current.nextElementSibling ?? current.previousElementSibling
  if (!adjacent) {
    return { currentIndex, slidesPerPage: 1 }
  }
  const currentRect = current.getBoundingClientRect()
  const adjRect = adjacent.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  const itemWidth = currentRect.width
  if (!itemWidth) return { currentIndex, slidesPerPage: 1 }
  const gap = Math.abs(adjRect.x - currentRect.x) - itemWidth
  const fractional =
    Math.round(containerRect.width + gap) / Math.round(itemWidth + gap)

  /**
   * Never allow more slides per page than children.
   *
   * If the parent container width is unconstrained, allowing more sliders per
   * page than children can cause the carousel to
   * 1. determine slides per page
   * 2. increase the content width
   * 3. ...which increases parent width (if it is unconstrained)
   * 4. which changes slides per page... ad infinitum.
   *
   * Capping slidesPerPage at the number of slides prevents this, and there's
   * never any reason to show more slides than there are.
   */
  const slidesPerPage = Math.min(Math.floor(fractional), slides.length)
  return { currentIndex, slidesPerPage }
}

/**
 * This is a horizontal carousel intended for fixed-width slides, potentially
 * with a gab between the slides.
 *
 * The carousel shows as many slides as possible in the available space.
 *
 * The "pagesize" is however many slides are fully visible.
 *
 * Swapping and drag events are supported, and also move the carousel by the
 * page size.
 *
 * NOTES:
 * 1. The carousel root (or an ancestor) should have a constrained width.
 *
 * 2. The children of this carousel should NOT have a `style` prop.
 * If it does, react-slick will override the style.
 * See also https://github.com/akiran/react-slick/issues/1378
 */
const Carousel: React.FC<CarouselProps> = ({
  children,
  className,
  initialSlide = 0,
  arrowsContainer,
  arrowGroupLabel = "Slide navigation",
  prevLabel = "Show previous slides",
  nextLabel = "Show next slides",
}) => {
  const [slick, setSlick] = React.useState<Slick | null>(null)
  const [slidesPerPage, setSlidesPerPage] = React.useState<number>(1)
  /**
   * The index of the first visible slide.
   * slick-carousel marks this slide with slick-current.
   */
  const [currentIndex, setCurrentIndex] = React.useState<number>(0)
  const canPrev = currentIndex > 0
  const canNext = currentIndex + slidesPerPage < React.Children.count(children)
  const onReInit = useCallback(() => {
    if (!slick) return
    const container = slick.innerSlider?.list
    if (!container) return
    const slideInfo = getSlideInfo(container)
    if (slideInfo.slidesPerPage !== undefined) {
      setSlidesPerPage(slideInfo.slidesPerPage)
    }
    if (slideInfo.currentIndex !== undefined) {
      setCurrentIndex(slideInfo.currentIndex)
    }
    onReInitSlickA11y(slick)
  }, [slick])
  const nextPage = React.useCallback(() => {
    if (!slick) return
    slick.slickNext()
  }, [slick])
  const prevPage = React.useCallback(() => {
    if (!slick) return
    slick.slickPrev()
  }, [slick])

  const arrows = (
    <>
      <ActionButton
        size="small"
        edge="rounded"
        variant="tertiary"
        onClick={prevPage}
        disabled={!canPrev}
        aria-label={prevLabel}
      >
        <RiArrowLeftLine aria-hidden />
      </ActionButton>
      <ActionButton
        size="small"
        edge="rounded"
        variant="tertiary"
        onClick={nextPage}
        disabled={!canNext}
        aria-label={nextLabel}
      >
        <RiArrowRightLine aria-hidden />
      </ActionButton>
    </>
  )

  return (
    <>
      <SlickStyled
        className={className}
        ref={setSlick}
        variableWidth
        initialSlide={initialSlide}
        infinite={false}
        autoplay={false}
        onReInit={onReInit}
        slidesToShow={slidesPerPage}
        slidesToScroll={slidesPerPage}
        arrows={false}
      >
        {children}
      </SlickStyled>
      {arrowsContainer === undefined ? (
        <div role="group" aria-label={arrowGroupLabel}>
          {arrows}
        </div>
      ) : null}
      {arrowsContainer ? createPortal(arrows, arrowsContainer) : null}
    </>
  )
}

export { Carousel, onReInitSlickA11y }
export type { CarouselProps }
