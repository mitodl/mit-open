import { styled } from "ol-components"
import { MITLogoLink } from "ol-utilities"
import * as urls from "@/common/urls"
import React, { FunctionComponent } from "react"

const PUBLIC_URL = process.env.PUBLIC_URL || ""
const HOME_URL = `${PUBLIC_URL}/`

const FooterContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  alignSelf: "stretch",
  backgroundColor: theme.custom.colors.white,
  borderTop: `1px solid ${theme.custom.colors.darkGray2}`,
}))

const FooterContainerInner = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "1272px",
  padding: "32px 0",
})

const FooterContent = styled.div({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  alignSelf: "stretch",
})

const FooterLeftContainer = styled.div({
  display: "flex",
  alignItems: "center",
  gap: "30px",
})

const FooterLogo = styled(MITLogoLink)({
  width: "94px",
})

const FooterAddress = styled.address(({ theme }) => ({
  color: theme.custom.colors.black,
  ...theme.typography.body2,
}))

const FooterRightContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  justifyContent: "center",
  gap: "32px",
})

const FooterLinksContainer = styled.div({
  display: "flex",
  alignItems: "flex-start",
  gap: "16px",
})

const FooterLinkContainer = styled.div({
  display: "flex",
  padding: "0 16px",
  alignItems: "flex-start",
})

const FooterLink = styled.a(({ theme }) => ({
  color: theme.custom.colors.black,
  textDecoration: "none",
  textAlign: "center",
  "&:hover": {
    color: theme.custom.colors.red,
    textDecoration: "none",
  },
  ...theme.typography.body2,
}))

interface FooterLinkComponentProps {
  href?: string
  text?: string
}

const FooterLinkComponent: FunctionComponent<FooterLinkComponentProps> = (
  props,
) => {
  const { href, text } = props
  return (
    <FooterLinkContainer>
      <FooterLink href={href}>{text}</FooterLink>
    </FooterLinkContainer>
  )
}

const FooterCopyrightContainer = styled.div({
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  padding: "0 16px",
  gap: "10px",
})

const FooterCopyright = styled.span(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  ...theme.typography.body2,
}))

const Footer: FunctionComponent = () => {
  return (
    <FooterContainer>
      <FooterContainerInner>
        <FooterContent>
          <FooterLeftContainer>
            <FooterLogo
              href="https://mit.edu/"
              src="/static/images/mit-logo-transparent5.svg"
            />
            <FooterAddress>
              Massachusetts Institute of Technology
              <br />
              77 Massachusetts Avenue
              <br />
              Cambridge, MA 02139
            </FooterAddress>
          </FooterLeftContainer>
          <FooterRightContainer>
            <FooterLinksContainer>
              <FooterLinkComponent text="Home" href={HOME_URL} />
              <FooterLinkComponent text="About Us" href={urls.ABOUT} />
              <FooterLinkComponent
                text="Accessibility"
                href={urls.ACCESSIBILITY}
              />
              <FooterLinkComponent text="Privacy Policy" href={urls.PRIVACY} />
              <FooterLinkComponent text="Terms of Service" href={urls.TERMS} />
              <FooterLinkComponent text="Contact Us" href={urls.CONTACT} />
            </FooterLinksContainer>
            <FooterCopyrightContainer>
              <FooterCopyright>
                © 2024 Massachusetts Institute of Technology
              </FooterCopyright>
            </FooterCopyrightContainer>
          </FooterRightContainer>
        </FooterContent>
      </FooterContainerInner>
    </FooterContainer>
  )
}

export default Footer
