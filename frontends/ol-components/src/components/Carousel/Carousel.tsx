import React, { ElementType, useState, useRef } from "react"
import { Carousel as NukaCarousel, SlideHandle } from "nuka-carousel"
import type { CarouselProps as NukaCarouselProps } from "nuka-carousel"
import styled from "@emotion/styled"
import { ActionButton } from "../Button/Button"
import Stack from "@mui/material/Stack"
import { RiArrowRightLine, RiArrowLeftLine } from "@remixicon/react"
import type { ButtonStyleProps } from "../Button/Button"

type CarouselButtonAlignment = "left" | "center" | "right"

type NukaCarouselStyledProps = NukaCarouselProps & {
  cellSpacing?: number
  animationDuration?: number
}

type CarouselProps = NukaCarouselStyledProps & {
  children: React.ReactNode
  as?: ElementType
  className?: string
  pageSize: number
  /**
   * Animation duration in milliseconds.
   */
  animationDuration?: number
  cellSpacing?: number
  buttonAlignment?: CarouselButtonAlignment
  buttonVariant?: ButtonStyleProps["variant"]
  buttonSize?: ButtonStyleProps["size"]
  pageLeftIcon?: React.ReactNode
  pageRightIcon?: React.ReactNode
}

const DEFAULT_CAROUSEL_SPACING = 24
const DEFAULT_ANIMATION_DURATION = 800

const NukaCarouselStyled = styled(NukaCarousel)<NukaCarouselStyledProps>`
  .nuka-slide-container {
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
  pageRightIcon = <RiArrowRightLine />,
  pageLeftIcon = <RiArrowLeftLine />,
  buttonAlignment = "right",
  buttonVariant = "filled",
  buttonSize = "small",
  wrapMode = "nowrap",
  scrollDistance = "slide",
}) => {
  const ref = useRef<SlideHandle>(null)

  const [index, setIndex] = useState(0)
  const childCount = React.Children.count(children)
  const canPageUp = wrapMode === "wrap" || index + pageSize < childCount
  const canPageDown = wrapMode === "wrap" || index !== 0

  const pageDown = () => {
    ref && ref.current && ref.current.goBack()
    setIndex(index - pageSize)
  }

  const pageUp = () => {
    ref && ref.current && ref.current.goForward()
    const newIdx = index + pageSize

    setIndex(newIdx)
  }

  return (
    <ContainerComponent id="hello" className={className}>
      <NukaCarouselStyled
        showArrows={false}
        showDots={false}
        autoplay={false}
        cellSpacing={cellSpacing}
        animationDuration={animationDuration}
        ref={ref}
        wrapMode={wrapMode}
        scrollDistance={scrollDistance}
      >
        {children}
      </NukaCarouselStyled>
      <Stack
        direction="row"
        justifyContent={buttonAlignment || "center"}
        spacing={3}
        marginTop={3}
      >
        <ActionButton
          size="small"
          edge="circular"
          onClick={pageDown}
          disabled={!canPageDown}
          aria-label="Previous"
          variant={buttonVariant}
        >
          {pageLeftIcon}
        </ActionButton>
        <ActionButton
          size="small"
          edge="circular"
          onClick={pageUp}
          disabled={!canPageUp}
          aria-label="Next"
          variant={buttonVariant}
        >
          {pageRightIcon}
        </ActionButton>
      </Stack>
    </ContainerComponent>
  )
}

export { Carousel }
export type { CarouselProps, CarouselButtonAlignment }
