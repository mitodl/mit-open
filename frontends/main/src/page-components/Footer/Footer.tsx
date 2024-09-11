"use client"

import { Container, styled } from "ol-components"
import MITLogoLink from "@/components/MITLogoLink/MITLogoLink"
import * as urls from "@/common/urls"
import React, { FunctionComponent } from "react"
import footerLogo from "../../../public/images/mit-logo-transparent5.svg"

const FooterContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  alignSelf: "stretch",
  backgroundColor: theme.custom.colors.white,
  borderTop: `1px solid ${theme.custom.colors.darkGray2}`,
}))

const FooterContainerInner = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "32px 0",
  [theme.breakpoints.down("md")]: {
    padding: "26px 16px",
    alignSelf: "stretch",
  },
}))

const FooterContent = styled.div(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  alignSelf: "stretch",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    gap: "16px",
  },
}))

const FooterLeftContainer = styled.div(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "30px",
  [theme.breakpoints.down("md")]: {
    alignSelf: "stretch",
    gap: "16px",
  },
}))

const FooterLogo = styled(MITLogoLink)(({ theme }) => ({
  position: "relative",
  width: "95px",
  height: "48px",
  [theme.breakpoints.down("md")]: {
    width: "80px",
    height: "40px",
  },
}))

const FooterAddress = styled.address(({ theme }) => ({
  color: theme.custom.colors.black,
  ...theme.typography.body2,
  [theme.breakpoints.down("md")]: {
    flex: "1 0 0",
  },
}))

const FooterRightContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  justifyContent: "center",
  gap: "32px",
  [theme.breakpoints.down("md")]: {
    alignItems: "flex-start",
    alignSelf: "stretch",
    gap: "16px",
  },
}))

const FooterLinksContainer = styled.div(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: "16px",
  [theme.breakpoints.down("md")]: {
    alignContent: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
  },
}))

const FooterLinkContainer = styled.div(({ theme }) => ({
  display: "flex",
  padding: "0 16px",
  alignItems: "flex-start",
  [theme.breakpoints.down("md")]: {
    padding: "0",
  },
}))

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

const FooterCopyrightContainer = styled.div(({ theme }) => ({
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  padding: "0 16px",
  gap: "10px",
  [theme.breakpoints.down("md")]: {
    padding: "0",
  },
}))

const FooterCopyright = styled.span(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  ...theme.typography.body2,
}))

const Footer: FunctionComponent = () => {
  return (
    <FooterContainer role="contentinfo">
      <Container>
        <FooterContainerInner>
          <FooterContent>
            <FooterLeftContainer>
              <FooterLogo href="https://mit.edu/" logo={footerLogo} />
              <FooterAddress data-testid="footer-address">
                Massachusetts Institute of Technology
                <br />
                77 Massachusetts Avenue
                <br />
                Cambridge, MA 02139
              </FooterAddress>
            </FooterLeftContainer>
            <FooterRightContainer>
              <FooterLinksContainer>
                <FooterLinkComponent text="Home" href={urls.HOME} />
                <FooterLinkComponent text="About Us" href={urls.ABOUT} />
                <FooterLinkComponent
                  text="Accessibility"
                  href={urls.ACCESSIBILITY}
                />
                <FooterLinkComponent
                  text="Privacy Policy"
                  href={urls.PRIVACY}
                />
                <FooterLinkComponent text="Contact Us" href={urls.CONTACT} />
              </FooterLinksContainer>
              <FooterCopyrightContainer>
                <FooterCopyright>
                  &copy; {new Date().getFullYear()} Massachusetts Institute of
                  Technology
                </FooterCopyright>
              </FooterCopyrightContainer>
            </FooterRightContainer>
          </FooterContent>
        </FooterContainerInner>
      </Container>
    </FooterContainer>
  )
}

export default Footer
