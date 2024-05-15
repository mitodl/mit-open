import Drawer, { DrawerProps } from "@mui/material/Drawer"
import styled from "@emotion/styled"
import React from "react"

const DrawerContent = styled.div(({ theme }) => ({
  paddingTop: "80px",
  width: "350px",
  height: "100%",
  background: theme.custom.colors.white,
  borderRight: `1px solid ${theme.custom.colors.lightGray2}`,
  [theme.breakpoints.down("sm")]: {
    height: "60px",
  },
}))

const NavSection = styled.div(({ theme }) => ({
  padding: "16px 24px",
  borderBottom: `1px solid ${theme.custom.colors.lightGray2}`,
}))

const NavSectionHeader = styled.div(({ theme }) => ({
  paddingLeft: "8px",
  color: theme.custom.colors.silverGrayDark,
  ...theme.typography.subtitle4,
}))

const NavLinkText = styled.div(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  ...theme.typography.subtitle3,
}))

const NavLinkDescription = styled.div(({ theme }) => ({
  display: "inline-block",
  paddingTop: "4px",
  color: theme.custom.colors.silverGrayDark,
  ...theme.typography.body3,
}))

const NavItemContainer = styled.div(({ theme }) => ({
  padding: "8px",
  borderRadius: "4px",
  "&:hover": {
    background: theme.custom.colors.lightGray2,
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

type NavItemProps = {
  title: string
  description?: string
  href?: string
}

const NavItem: React.FC<NavItemProps> = (props) => {
  const { title, description, href } = props
  const navItem = (
    <NavItemContainer>
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
    </NavItemContainer>
  )
  return href ? (
    <a href={href} data-testid="nav-link">
      {navItem}
    </a>
  ) : (
    navItem
  )
}

export interface NavData {
  sections: NavSection[]
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export interface NavItem {
  title: string
  description?: string
  href?: string
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
        description={item.description}
        href={item.href}
      />
    ))
    return (
      <NavSection key={section.title}>
        <NavSectionHeader>{section.title}</NavSectionHeader>
        {navItemElements}
      </NavSection>
    )
  })

  return (
    <Drawer
      anchor="left"
      variant="persistent"
      elevation={0}
      hideBackdrop={false}
      PaperProps={{
        sx: {
          boxShadow: "0px 6px 24px 0px rgba(37, 38, 43, 0.10)",
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
