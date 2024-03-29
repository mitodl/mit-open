import React from "react"
import styled from "@emotion/styled"

const BANNER_HEIGHT = "200px"
const SM_BANNER_HEIGHT = "115px"
const BACKGROUND_FALLBACK_COLOR = "#20316d"

interface ImgProps {
  /**
   * The `src` attribute for the banner image.
   */
  src?: string | null
  /**
   * The `alt` attribute for the banner image.
   */
  alt?: string
}

/**
 * Prefer direct use of `BannerPage` component.
 */
const BannerContainer = styled.div`
  position: absolute;
  width: 100%;
  z-index: -1;
`

const imageStylesheet = `
  width: 100%;
  display: block;
`

const StyledImage = styled.img`
  ${imageStylesheet}
  object-fit: cover;
  height: ${BANNER_HEIGHT};
  ${({ theme }) => theme.breakpoints.down("sm")} {
    height: ${SM_BANNER_HEIGHT};
  }
`

const PlaceholderDiv = styled.div`
  ${imageStylesheet}
  background-color: ${BACKGROUND_FALLBACK_COLOR};
  min-height: ${BANNER_HEIGHT};
  ${({ theme }) => theme.breakpoints.down("sm")} {
    min-height: ${SM_BANNER_HEIGHT};
  }
`

/**
 * Prefer direct use of `BannerPage` component.
 */
const BannerImage = ({ src, alt }: ImgProps) =>
  src ? <StyledImage src={src} alt={alt || ""} /> : <PlaceholderDiv />

/**
 * Prefer direct use of `BannerPage` component.
 */
const BannerPageWrapper = styled.div`
  position: relative;
  width: 100%;
`

interface BannerPageProps extends ImgProps {
  omitBackground?: boolean
  className?: string
  /**
   * Child elements placed below the banner.
   */
  children?: React.ReactNode
  /**
   * Child elements within the banner.
   *
   * By default, the banner content will be vertically centered. Customize this
   * behavior with `bannerContainerClass`.
   */
  bannerContent?: React.ReactNode
  bannerContainerClass?: string
}

const BannerPageHeaderFlex = styled.header`
  min-height: ${BANNER_HEIGHT};
  ${({ theme }) => theme.breakpoints.down("sm")} {
    min-height: ${SM_BANNER_HEIGHT};
  }

  display: flex;
  flex-direction: column;
  justify-content: center;
`

/**
 * Layout a page with a banner at top and content below. Supports optional
 * content with the banner.
 */
const BannerPage: React.FC<BannerPageProps> = ({
  className,
  src,
  bannerContent,
  bannerContainerClass,
  alt,
  children,
  omitBackground,
}) => {
  return (
    <BannerPageWrapper className={className}>
      <BannerPageHeaderFlex className={bannerContainerClass}>
        <BannerContainer>
          {!omitBackground && <BannerImage src={src} alt={alt} />}
        </BannerContainer>
        {bannerContent}
      </BannerPageHeaderFlex>
      {children}
    </BannerPageWrapper>
  )
}

export { BannerPage }
