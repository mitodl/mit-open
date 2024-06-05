import React, { ElementType, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { Carousel as NukaCarousel, SlideHandle } from "nuka-carousel"
import type { CarouselProps as NukaCarouselProps } from "nuka-carousel"
import styled from "@emotion/styled"
import { ActionButton } from "../Button/Button"
import Stack from "@mui/material/Stack"
import { RiArrowRightLine, RiArrowLeftLine } from "@remixicon/react"

type CarouselProps = {
  children: React.ReactNode
  as?: ElementType
  className?: string
  pageSize: number
  /**
   * Animation duration in milliseconds.
   */
  animationDuration?: number
  cellSpacing?: number
  arrowsContainer?: HTMLElement | null
}

type NukaCarouselStyledProps = NukaCarouselProps & {
  cellSpacing?: number
  animationDuration?: number
}

const DEFAULT_CAROUSEL_SPACING = 24
const DEFAULT_ANIMATION_DURATION = 800

const NukaCarouselStyled = styled(NukaCarousel)<NukaCarouselStyledProps>`
  .nuka-slide-container {
    transform: translateX(-${(props) => (props.cellSpacing || 0) * 0.5}px);
    transition-duration: ${(props) => props.animationDuration || 0};
    padding-bottom: 6px;
    margin-bottom: -6px;
    padding-top: 6px;
    margin-top: -6px;
  }
`

const Carousel: React.FC<CarouselProps> = ({
  children,
  className,
  cellSpacing = DEFAULT_CAROUSEL_SPACING,
  animationDuration = DEFAULT_ANIMATION_DURATION,
  pageSize,
  as: ContainerComponent = "div",
  arrowsContainer,
}) => {
  const ref = useRef<SlideHandle>(null)

  const [index, setIndex] = useState(0)
  const childCount = React.Children.count(children)
  const canPageUp = index + pageSize < childCount
  const canPageDown = index !== 0

  const pageDown = () => {
    ref && ref.current && ref.current.goBack()
    setIndex(index - pageSize)
  }

  const pageUp = () => {
    ref && ref.current && ref.current.goForward()
    setIndex(index + pageSize)
  }

  const buttons = (
    <Stack direction="row" justifyContent="end" spacing={3}>
      <ActionButton
        size="small"
        edge="circular"
        onClick={pageDown}
        disabled={!canPageDown}
        aria-label="Previous"
      >
        <RiArrowLeftLine />
      </ActionButton>
      <ActionButton
        size="small"
        edge="circular"
        onClick={pageUp}
        disabled={!canPageUp}
        aria-label="Next"
      >
        <RiArrowRightLine />
      </ActionButton>
    </Stack>
  )

  return (
    <ContainerComponent id="hello" className={className}>
      <NukaCarouselStyled
        showArrows={false}
        showDots={false}
        autoplay={false}
        cellSpacing={cellSpacing}
        animationDuration={animationDuration}
        ref={ref}
      >
        {children}
      </NukaCarouselStyled>
      {arrowsContainer ? createPortal(buttons, arrowsContainer) : buttons}
    </ContainerComponent>
  )
}

export { Carousel }
export type { CarouselProps }
