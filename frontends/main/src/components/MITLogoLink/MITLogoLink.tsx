import React from "react"
import Image from "next/image"
import Link from "next/link"
import mitLogoBlack from "@/public/images/mit-logo-black.svg"
import whiteLogoWhite from "@/public/images/mit-logo-white.svg"
import learnLogo from "@/public/images/mit-learn-logo.svg"
import { styled } from "ol-components"

interface Props {
  logo: "mit_white" | "mit_black" | "learn"
  className?: string
}

const StyledImage = styled(Image)({
  /**
   * Needs display: block because otherwise the image is inline, which complicates
   * parent container height calculations.
   *
   * See https://stackoverflow.com/a/11126701/2747370
   */
  display: "block",
  width: "auto",
})

const linkProps = {
  learn: {
    href: "/",
    title: "MIT Learn Homepage",
  },
  mit_black: {
    href: "https://mit.edu/",
    title: "MIT Homepage",
    target: "_blank",
  },
  mit_white: {
    href: "https://mit.edu/",
    title: "MIT Homepage",
    target: "_blank",
  },
}
const imageProps = {
  learn: {
    src: learnLogo,
  },
  mit_black: {
    src: mitLogoBlack,
  },
  mit_white: {
    src: whiteLogoWhite,
  },
}

/**
 * Used for MIT logo variations.
 *
 * To size the logo, specify at least the `height` of `img` via the parent's className.
 */
const MITLogoLink: React.FC<Props> = ({ logo, className }) => {
  return (
    <Link
      className={className}
      {...linkProps[logo]}
      // eslint-disable-next-line react/no-unknown-property
      appzi-screenshot-exclude="true"
      rel="noopener"
    >
      <StyledImage {...imageProps[logo]} alt="" />
    </Link>
  )
}
export default MITLogoLink
