import React from "react"
import Image from "next/image"
import defaultLogo from "../../../public/mit-logo-learn.svg"

interface Props {
  href?: string
  className?: string
  logo?: string
  alt?: string
}

const MITLogoLink: React.FC<Props> = ({
  href,
  logo,
  alt = "MIT Learn Logo",
  className,
}) => (
  <a
    href={href}
    title="Link to Homepage"
    className={className}
    // eslint-disable-next-line react/no-unknown-property
    appzi-screenshot-exclude="true"
  >
    <Image src={logo || defaultLogo} alt={alt} fill />
  </a>
)

export default MITLogoLink
