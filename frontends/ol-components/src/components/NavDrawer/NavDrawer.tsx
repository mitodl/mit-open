import Drawer, { DrawerProps } from "@mui/material/Drawer"
import styled from "@emotion/styled"
import React from "react"

const DrawerContent = styled.div(({ theme }) => ({
  paddingTop: "80px",
  width: "366px",
  height: "100%",
  background: theme.custom.colors.white,
  borderRight: `1px solid ${theme.custom.colors.lightGray2}`,
  [theme.breakpoints.down("sm")]: {
    height: "60px",
  },
}))

const NavSection = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  alignSelf: "stretch",
  padding: "24px 32px 8px 32px",
  gap: "12px",
})

const NavSectionHeader = styled.div(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  alignSelf: "stretch",
  color: theme.custom.colors.darkGray1,
  ...theme.typography.subtitle3,
}))

const NavItemsContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  alignSelf: "stretch",
  gap: "12px",
})

const NavItemLink = styled.a({
  display: "flex",
  alignItems: "flex-start",
  alignSelf: "stretch",
  textDecoration: "none !important",
})

const NavItemContainer = styled.div(({ theme }) => ({
  display: "flex",
  padding: "4px 0",
  alignItems: "flex-start",
  alignSelf: "stretch",
  gap: "16px",
  "&:hover": {
    ".nav-link-text": {
      color: theme.custom.colors.red,
      textDecorationLine: "underline",
      textDecorationColor: theme.custom.colors.red,
    },
    ".nav-link-description": {
      color: theme.custom.colors.darkGray1,
    },
  },
}))

const NavImageContainer = styled.div({
  display: "flex",
  alignItems: "flex-start",
})

const NavImage = styled.img({
  width: "22px",
  height: "22px",
})

const NavTextContainer = styled.div({
  display: "flex",
  flex: "1 0 0",
  flexDirection: "column",
  alignItems: "flex-start",
  alignSelf: "center",
  gap: "4px",
})

const NavLinkText = styled.div(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  ...theme.typography.subtitle3,
}))

const NavLinkDescription = styled.div(({ theme }) => ({
  alignSelf: "stretch",
  color: theme.custom.colors.darkGray1,
  ...theme.typography.body3,
}))

export interface NavData {
  sections: NavSection[]
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export interface NavItem {
  title: string
  image?: string
  description?: string
  href?: string
}

const NavItem: React.FC<NavItem> = (props) => {
  const { title, image, description, href } = props
  const navItem = (
    <NavItemContainer>
      <NavImageContainer style={{ paddingTop: description ? "4px" : "" }}>
        {image ? <NavImage className="nav-link-image" src={image} /> : null}
      </NavImageContainer>
      <NavTextContainer>
        <NavLinkText className="nav-link-text" data-testid="nav-link-text">
          {title} {href ? "" : "(Coming Soon)"}
        </NavLinkText>
        {description ? (
          <NavLinkDescription
            className="nav-link-description"
            data-testid="nav-link-description"
          >
            {description}
          </NavLinkDescription>
        ) : null}
      </NavTextContainer>
    </NavItemContainer>
  )
  return href ? (
    <NavItemLink href={href} data-testid="nav-link">
      {navItem}
    </NavItemLink>
  ) : (
    navItem
  )
}

type NavDrawerProps = {
  navdata: NavData
} & DrawerProps

const NavDrawer = (props: NavDrawerProps) => {
  const { navdata } = props
  const navSections = navdata.sections.map((section) => {
    const navItemElements = section.items.map((item) => (
      <NavItem
        key={item.title}
        title={item.title}
        image={item.image}
        description={item.description}
        href={item.href}
      />
    ))
    return (
      <NavSection key={section.title}>
        <NavSectionHeader>{section.title}</NavSectionHeader>
        <NavItemsContainer>{navItemElements}</NavItemsContainer>
      </NavSection>
    )
  })

  return (
    <Drawer
      anchor="left"
      variant="persistent"
      elevation={0}
      hideBackdrop={true}
      PaperProps={{
        sx: {
          boxShadow: "0px 6px 24px 0px rgba(37, 38, 43, 0.10)",
          zIndex: (theme) => theme.zIndex.appBar - 1,
        },
      }}
      {...props}
    >
      <DrawerContent>{navSections}</DrawerContent>
    </Drawer>
  )
}

export { NavDrawer }
export type { NavDrawerProps }
