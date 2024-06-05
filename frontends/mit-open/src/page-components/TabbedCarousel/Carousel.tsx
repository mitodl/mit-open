import React from "react"
import { createPortal } from "react-dom"
import { Carousel as NukaCarousel, useCarousel } from "nuka-carousel"
import type { CarouselProps as NukaCarouselProps } from "nuka-carousel"
import { styled, ActionButton } from "ol-components"
import { RiArrowRightLine, RiArrowLeftLine } from "@remixicon/react"

type CarouselProps = {
  children: React.ReactNode
  className?: string
  /**
   * Animation duration in milliseconds.
   */
  animationDuration?: number
  arrowsContainer?: HTMLElement | null
}

type NukaCarouselStyledProps = NukaCarouselProps & {
  animationDuration?: number
}

const DEFAULT_ANIMATION_DURATION = 800

const NukaCarouselStyled = styled(NukaCarousel)<NukaCarouselStyledProps>({
  ".nuka-wrapper": {
    gap: "24px",
  },
})

const ArrowControls = () => {
  const { goForward, goBack, currentPage, totalPages } = useCarousel()
  const canPageDown = currentPage > 0
  const canPageUp = currentPage < totalPages - 1
  return (
    <>
      <ActionButton
        size="small"
        edge="rounded"
        variant="tertiary"
        onClick={goBack}
        disabled={!canPageDown}
        aria-label="Previous"
      >
        <RiArrowLeftLine />
      </ActionButton>
      <ActionButton
        size="small"
        edge="rounded"
        variant="tertiary"
        onClick={goForward}
        disabled={!canPageUp}
        aria-label="Next"
      >
        <RiArrowRightLine />
      </ActionButton>
    </>
  )
}

const Carousel: React.FC<CarouselProps> = ({
  children,
  className,
  animationDuration = DEFAULT_ANIMATION_DURATION,
  arrowsContainer,
}) => {
  return (
    <NukaCarouselStyled
      className={className}
      showDots={false}
      autoplay={false}
      animationDuration={animationDuration}
      showArrows={!!arrowsContainer}
      arrows={
        arrowsContainer
          ? createPortal(<ArrowControls />, arrowsContainer)
          : null
      }
    >
      {children}
    </NukaCarouselStyled>
  )
}

export { Carousel }
export type { CarouselProps }
