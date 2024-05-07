import { Drawer, DrawerProps, styled } from "ol-components"
import { useToggle } from "ol-utilities"
import React from "react"
import * as urls from "@/common/urls"

const DrawerContent = styled.div`
  padding-top: 55px;
  width: 350px;
`

const NavSection = styled.div`
  padding: 15px 30px;
  border-bottom: 1px solid ${({ theme }) => theme.custom.colors.lightGray2};
`

const NavSectionHeader = styled.div`
  color: ${({ theme }) => theme.custom.colors.silverGrayDark};
  font-size: ${({ theme }) => theme.typography.subtitle4.fontSize};
  font-weight: ${({ theme }) => theme.typography.subtitle4.fontWeight};
`

type NavItemProps = {
  title: string
  description?: string
  href?: string
}

const NavItem: React.FC<NavItemProps> = (props) => {
  const { title, description, href } = props
  const navItem = (
    <div>
      <LinkText>{title}</LinkText>
      {description ? <LinkDescription>{description}</LinkDescription> : null}
    </div>
  )
  return href ? <a href={href}>{navItem}</a> : navItem
}

const LinkText = styled.div`
  padding-top: 10px;
  color: ${({ theme }) => theme.custom.colors.darkGray2};
  font-size: ${({ theme }) => theme.typography.subtitle3.fontSize};
  font-weight: ${({ theme }) => theme.typography.subtitle3.fontWeight};
`

const LinkDescription = styled.div`
  padding: 5px 0px 10px 0px;
  color: ${({ theme }) => theme.custom.colors.silverGrayDark};
  font-size: ${({ theme }) => theme.typography.body3.fontSize};
  font-weight: ${({ theme }) => theme.typography.body3.fontWeight};
`

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
          href: `${urls.SEARCH}?${new URLSearchParams({
            resource_type: "course",
          }).toString()}`,
        },
        {
          title: "Programs",
          description:
            "Learn in-depth from a series of courses and earn a certificate",
          href: `${urls.SEARCH}?${new URLSearchParams({
            resource_type: "program",
          }).toString()}`,
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
        },
        {
          title: "Upcoming",
        },
        {
          title: "Popular",
        },
        {
          title: "Free",
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
      {...props}
    >
      <DrawerContent>{navSections}</DrawerContent>
    </Drawer>
  )
}

export { NavDrawer }
