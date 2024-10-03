import React, { HTMLAttributeAnchorTarget } from "react"
import Image from "next/image"
import Link from "next/link"
import defaultLogo from "@/public/images/mit-logo-black.svg"

interface Props {
  href?: string
  className?: string
  logo?: string
  alt?: string
  target?: HTMLAttributeAnchorTarget
}

const MITLogoLink: React.FC<Props> = ({
  href,
  logo,
  alt = "MIT Logo",
  className,
  target,
}) => (
  <Link
    href={href || "/"}
    title="Link to Homepage"
    className={className}
    target={target}
    // eslint-disable-next-line react/no-unknown-property
    appzi-screenshot-exclude="true"
    rel="noreferrer"
  >
    <Image src={logo || defaultLogo} alt={alt} fill />
  </Link>
)

export default MITLogoLink
