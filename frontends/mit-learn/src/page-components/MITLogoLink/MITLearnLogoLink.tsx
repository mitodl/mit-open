import { Link, pxToRem, styled, Typography } from "ol-components"
import React from "react"

const PUBLIC_URL = APP_SETTINGS.PUBLIC_URL
const HOME_URL = `${PUBLIC_URL}/`

const LogoContainer = styled.div({
  display: "flex",
  flexDirection: "row",
})

const LogoLink = styled(Link)({
  "&:hover": {
    textDecoration: "none",
  },
})

const LogoText = styled(Typography)(({ theme }) => ({
  display: "flex",
  fontFamily: "neue-haas-grotesk-display, sans-serif",
  color: theme.custom.colors.white,
  leadingTrim: "both",
  textEdge: "cap",
  // eslint-disable-next-line no-restricted-syntax
  fontWeight: theme.typography.fontWeightRegular,
  fontStyle: "normal",
  fontSize: pxToRem(34),
  lineHeight: pxToRem(40),
  [theme.breakpoints.down("md")]: {
    fontSize: pxToRem(24),
  },
}))

const BoldMit = styled(LogoText)({
  // eslint-disable-next-line no-restricted-syntax
  fontWeight: 900,
})

interface Props {
  href?: string
  className?: string
}

const MITLearnLogoLink: React.FC<Props> = ({ href, className }) => (
  <LogoLink
    href={href ? href : HOME_URL}
    title="Link to MIT Learn Homepage"
    className={className}
    // eslint-disable-next-line react/no-unknown-property
    appzi-screenshot-exclude="true"
  >
    <LogoContainer>
      <BoldMit>MIT&nbsp;</BoldMit>
      <LogoText>Learn</LogoText>
    </LogoContainer>
  </LogoLink>
)

export default MITLearnLogoLink
