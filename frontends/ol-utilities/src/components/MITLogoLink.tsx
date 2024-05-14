import React from "react"

const PUBLIC_URL = process.env.PUBLIC_URL || ""
const MIT_LOGO_URL = `${PUBLIC_URL}/static/images/mit-logo-transparent4.svg`

interface Props {
  className?: string
}

const MITLogoLink: React.FC<Props> = ({ className }) => (
  <a
    href="https://www.mit.edu/"
    title="Link to MIT Homepage"
    className={className}
    // eslint-disable-next-line react/no-unknown-property
    appzi-screenshot-exclude="true"
  >
    <img src={MIT_LOGO_URL} alt="MIT Logo" />
  </a>
)

export default MITLogoLink
