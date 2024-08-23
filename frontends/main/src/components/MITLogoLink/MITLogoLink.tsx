import React from "react"
import Image from "next/image"
import defaultLogo from "../../../public/mit-logo-learn.svg"

const PUBLIC_URL = process.env.NEXT_PUBLIC_PUBLIC_URL
const HOME_URL = `${PUBLIC_URL}/`


interface Props {
  href?: string
  className?: string
  logo?: string
}

const MITLogoLink: React.FC<Props> = ({ href, logo, className }) => (
  <a
    href={href ? href : HOME_URL}
    title="Link to Homepage"
    className={className}
    // eslint-disable-next-line react/no-unknown-property
    appzi-screenshot-exclude="true"
  >
    <Image src={logo || defaultLogo} alt="MIT Learn Logo" fill />
  </a>
)

export default MITLogoLink
