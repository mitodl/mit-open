import React, { useCallback } from "react"
import { createPortal } from "react-dom"
import Slick from "react-slick"
import { ActionButton } from "../Button/Button"
import { RiArrowRightLine, RiArrowLeftLine } from "@remixicon/react"

type CarouselProps = {
  children: React.ReactNode
  className?: string
  initialSlide?: number
  /**
   * Animation duration in milliseconds.
   */
  animationDuration?: number
  arrowsContainer?: HTMLElement | null
}

/**
 * Return the current slide and the sliders per paged, based on current element
 * rectangles.
 */
const getSlideInfo = (
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
  return {
    currentIndex,
    slidesPerPage: Math.floor(fractional),
  }
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
 * NOTE:
 * The children of this carousel should NOT have a `style` prop.
 * If it does, react-slick will override the style.
 * See also https://github.com/akiran/react-slick/issues/1378
 */
const Carousel: React.FC<CarouselProps> = ({
  children,
  className,
  initialSlide = 0,
  arrowsContainer,
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
  }, [slick])

  const nextPage = () => {
    if (!slick) return
    slick.slickNext()
  }
  const prevPage = () => {
    if (!slick) return
    slick.slickPrev()
  }

  const arrows = (
    <>
      <ActionButton
        size="small"
        edge="rounded"
        variant="tertiary"
        onClick={prevPage}
        disabled={!canPrev}
        aria-label="Previous"
      >
        <RiArrowLeftLine />
      </ActionButton>
      <ActionButton
        size="small"
        edge="rounded"
        variant="tertiary"
        onClick={nextPage}
        disabled={!canNext}
        aria-label="Next"
      >
        <RiArrowRightLine />
      </ActionButton>
    </>
  )

  return (
    <>
      <Slick
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
      </Slick>
      {arrowsContainer === undefined ? arrows : null}
      {arrowsContainer ? createPortal(arrows, arrowsContainer) : null}
    </>
  )
}

export { Carousel }
export type { CarouselProps }
