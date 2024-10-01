import { Link, styled } from "ol-components"
import React from "react"

const PUBLIC_URL = APP_SETTINGS.PUBLIC_URL
const MIT_LEARN_HOME_URL = `${PUBLIC_URL}/`

const MIT_LOGO_URL = `${PUBLIC_URL}/static/images/mit-logo-black.svg`

const StyledLink = styled(Link)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
})

interface Props {
  href?: string
  src?: string
  className?: string
  target?: string
}

const MITLogoLink: React.FC<Props> = ({ href, src, className, target }) => (
  <StyledLink
    href={href ? href : MIT_LEARN_HOME_URL}
    title="Link to Homepage"
    className={className}
    target={target ? target : "_self"}
    // eslint-disable-next-line react/no-unknown-property
    appzi-screenshot-exclude="true"
    rel="noreferrer"
  >
    <img src={src ? `${PUBLIC_URL}${src}` : MIT_LOGO_URL} alt="MIT Logo" />
  </StyledLink>
)

export default MITLogoLink
