import React from "react"

const PUBLIC_URL = process.env.NEXT_PUBLIC_PUBLIC_URL
const HOME_URL = `${PUBLIC_URL}/`
console.log(">>>>>>>>", process.env.NEXT_PUBLIC_PUBLIC_URL)
const MIT_LOGO_URL = `${PUBLIC_URL}/static/images/mit-logo-learn.svg`

interface Props {
  href?: string
  src?: string
  className?: string
}

const MITLogoLink: React.FC<Props> = ({ href, src, className }) => (
  <a
    href={href ? href : HOME_URL}
    title="Link to Homepage"
    className={className}
    // eslint-disable-next-line react/no-unknown-property
    appzi-screenshot-exclude="true"
  >
    <img src={src ? `${PUBLIC_URL}${src}` : MIT_LOGO_URL} alt="MIT Logo" />
  </a>
)

export default MITLogoLink
