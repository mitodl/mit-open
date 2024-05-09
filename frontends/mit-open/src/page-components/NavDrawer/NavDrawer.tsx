import { Drawer, DrawerProps, styled } from "ol-components"
import { useToggle } from "ol-utilities"
import React from "react"
import * as urls from "@/common/urls"

const DrawerContent = styled.div(({ theme }) => ({
  paddingTop: "55px",
  width: "350px",
  height: "100%",
  background: theme.custom.colors.white,
  borderRight: `1px solid ${theme.custom.colors.lightGray2}`,
}))

const NavSection = styled.div(({ theme }) => ({
  padding: "15px 20px",
  borderBottom: `1px solid ${theme.custom.colors.lightGray2}`,
}))

const NavSectionHeader = styled.div(({ theme }) => ({
  color: theme.custom.colors.silverGrayDark,
  fontSize: theme.typography.subtitle4.fontSize,
  fontWeight: theme.typography.subtitle4.fontWeight,
}))

const NavLinkText = styled.div(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  fontSize: theme.typography.subtitle3.fontSize,
  fontWeight: theme.typography.h4.fontWeight,
}))

const NavLinkDescription = styled.div(({ theme }) => ({
  display: "inline-block",
  paddingTop: "5px",
  color: theme.custom.colors.silverGrayDark,
  fontSize: theme.typography.body3.fontSize,
  fontWeight: theme.typography.body3.fontWeight,
}))

const NavItemContainer = styled.div(({ theme }) => ({
  padding: "10px",
  borderRadius: "5px",
  "&:hover": {
    background: theme.custom.colors.lightGray3,
    ".nav-link-text": {
      color: theme.custom.colors.red,
      textDecorationLine: "underline",
      textDecorationColor: theme.custom.colors.red,
    },
    ".nav-link-description": {
      color: theme.custom.colors.black,
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
      <NavLinkText className="nav-link-text">
        {title} {href ? "" : "(Coming Soon)"}
      </NavLinkText>
      {description ? (
        <NavLinkDescription className="nav-link-description">
          {description}
        </NavLinkDescription>
      ) : null}
    </NavItemContainer>
  )
  return href ? <a href={href}>{navItem}</a> : navItem
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

const navData: NavData = {
  sections: [
    {
      title: "LEARN",
      items: [
        {
          title: "Courses",
          description: "Learn with MIT instructors",
          href: urls.querifiedSearchUrl({ resource_type: "course" }),
        },
        {
          title: "Programs",
          description:
            "Learn in-depth from a series of courses and earn a certificate",
          href: urls.querifiedSearchUrl({ resource_type: "program" }),
        },
        {
          title: "Course Materials",
          description:
            "Free teaching and learning materials including videos, podcasts, lecture notes, etc.",
        },
      ],
    },
    {
      title: "BROWSE",
      items: [
        {
          title: "By Subject",
        },
        {
          title: "By Departments",
          href: urls.DEPARTMENTS,
        },
        {
          title: "By Provider",
        },
      ],
    },
    {
      title: "DISCOVER LEARNING RESOURCES",
      items: [
        {
          title: "New",
          href: urls.querifiedSearchUrl({
            resource_type: "course",
            sortby: "new",
          }),
        },
        {
          title: "Upcoming",
          href: urls.querifiedSearchUrl({
            resource_type: "course",
            sortby: "upcoming",
          }),
        },
        {
          title: "Popular",
          href: urls.querifiedSearchUrl({
            resource_type: "course",
            sortby: "popular",
          }),
        },
        {
          title: "Free",
          href: urls.querifiedSearchUrl({ free: "true" }),
        },
        {
          title: "With Certificate",
        },
      ],
    },
  ],
}

const NavDrawer = (props: DrawerProps) => {
  const [open, setOpen] = useToggle(false)

  const navSections = navData.sections.map((section) => {
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
      open={open}
      onClose={setOpen.off}
      hideBackdrop={true}
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
