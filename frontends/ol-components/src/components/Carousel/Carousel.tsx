import React from "react"
import { createPortal } from "react-dom"
import { Carousel as NukaCarousel, useCarousel } from "nuka-carousel"
import type { CarouselProps as NukaCarouselProps } from "nuka-carousel"
import styled from "@emotion/styled"
import { ActionButton } from "../Button/Button"
import Stack from "@mui/material/Stack"
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
  cellSpacing?: number
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
    <Stack direction="row" spacing={1}>
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
    </Stack>
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
      showArrows
      arrows={
        arrowsContainer ? (
          createPortal(<ArrowControls />, arrowsContainer)
        ) : (
          <ArrowControls />
        )
      }
    >
      {children}
    </NukaCarouselStyled>
  )
}

export { Carousel }
export type { CarouselProps }
