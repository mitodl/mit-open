import React, { FunctionComponent } from "react"
import type { NavData } from "ol-components"
import {
  styled,
  AppBar,
  Divider,
  NavDrawer,
  Toolbar,
  ClickAwayListener,
  ActionButtonLink,
} from "ol-components"
import { RiSearch2Line } from "@remixicon/react"
import { MITLogoLink, useToggle } from "ol-utilities"
import UserMenu from "./UserMenu"
import { MenuButton } from "./MenuButton"
import {
  DEPARTMENTS,
  TOPICS,
  RESOURCE_DRAWER_QUERY_PARAM,
  SEARCH,
  querifiedSearchUrl,
} from "@/common/urls"
import { useSearchParams } from "react-router-dom"
import { useUserMe } from "api/hooks/user"

const Bar = styled(AppBar)(({ theme }) => ({
  height: "80px",
  padding: "0 8px",
  backgroundColor: theme.custom.colors.white,
  color: theme.custom.colors.darkGray1,
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 2px 10px rgba(120 169 197 / 15%)",
  [theme.breakpoints.down("sm")]: {
    height: "60px",
    padding: "0",
  },
}))

const FlexContainer = styled.div({
  display: "flex",
  alignItems: "center",
})

const DesktopOnly = styled(FlexContainer)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    display: "flex",
  },
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}))

const MobileOnly = styled(FlexContainer)(({ theme }) => ({
  [theme.breakpoints.down("sm")]: {
    display: "flex",
  },
  [theme.breakpoints.up("sm")]: {
    display: "none",
  },
}))

const StyledToolbar = styled(Toolbar)({
  flex: 1,
})

const LogoLink = styled(MITLogoLink)(({ theme }) => ({
  display: "flex",
  border: "none",
  img: {
    width: 109,
    height: 40,
    [theme.breakpoints.down("sm")]: {
      marginLeft: "16px",
    },
  },
}))

const LeftDivider = styled(Divider)({
  margin: "0 24px",
})

const RightDivider = styled(Divider)(({ theme }) => ({
  margin: "0 32px",
  [theme.breakpoints.down("sm")]: {
    margin: "0 16px",
  },
}))

const Spacer = styled.div`
  flex: 1;
`

const StyledSearchIcon = styled(RiSearch2Line)(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  margin: "4px 0",
}))

const SearchButton: FunctionComponent = () => {
  return (
    <ActionButtonLink
      edge="rounded"
      variant="text"
      nativeAnchor={true}
      href={SEARCH}
    >
      <StyledSearchIcon />
    </ActionButtonLink>
  )
}

const LoggedOutView: FunctionComponent = () => {
  return (
    <FlexContainer>
      <DesktopOnly>
        <UserMenu variant="desktop" />
        <SearchButton />
      </DesktopOnly>
      <MobileOnly>
        <SearchButton />
        <RightDivider orientation="vertical" flexItem />
        <UserMenu variant="mobile" />
      </MobileOnly>
    </FlexContainer>
  )
}

const LoggedInView: FunctionComponent = () => {
  return (
    <FlexContainer>
      <SearchButton />
      <RightDivider orientation="vertical" flexItem />
      <UserMenu />
    </FlexContainer>
  )
}

const UserView: FunctionComponent = () => {
  const { isLoading, data: user } = useUserMe()
  if (isLoading) {
    return null
  }
  return user?.is_authenticated ? <LoggedInView /> : <LoggedOutView />
}

const navData: NavData = {
  sections: [
    {
      title: "LEARN",
      items: [
        {
          title: "Courses",
          icon: "/static/images/navdrawer/courses.svg",
          description: "Learn with MIT instructors",
          href: querifiedSearchUrl({ resource_type: "course" }),
        },
        {
          title: "Programs",
          icon: "/static/images/navdrawer/programs.svg",
          description:
            "Learn in-depth from a series of courses and earn a certificate",
          href: querifiedSearchUrl({ resource_type: "program" }),
        },
        {
          title: "Pathways",
          icon: "/static/images/navdrawer/pathways.svg",
          description:
            "Achieve your learning goals with a curated collection of courses",
        },
        {
          title: "Course Materials",
          icon: "/static/images/navdrawer/course_materials.svg",
          description:
            "Free teaching and learning materials including videos, podcasts, lecture notes, etc.",
        },
      ],
    },
    {
      title: "BROWSE",
      items: [
        {
          title: "By Topic",
          icon: "/static/images/navdrawer/topics.svg",
          href: TOPICS,
        },
        {
          title: "By Departments",
          icon: "/static/images/navdrawer/departments.svg",
          href: DEPARTMENTS,
        },
        {
          title: "By Provider",
          icon: "/static/images/navdrawer/provider.svg",
        },
      ],
    },
    {
      title: "DISCOVER LEARNING RESOURCES",
      items: [
        {
          title: "New",
          icon: "/static/images/navdrawer/new.svg",
          href: querifiedSearchUrl({
            resource_type: "course",
            sortby: "new",
          }),
        },
        {
          title: "Upcoming",
          icon: "/static/images/navdrawer/free.svg",
          href: querifiedSearchUrl({
            resource_type: "course",
            sortby: "upcoming",
          }),
        },
        {
          title: "Popular",
          icon: "/static/images/navdrawer/popular.svg",
          href: querifiedSearchUrl({
            resource_type: "course",
            sortby: "popular",
          }),
        },
        {
          title: "Free",
          icon: "/static/images/navdrawer/free.svg",
          href: querifiedSearchUrl({ free: "true" }),
        },
        {
          title: "With Certificate",
          icon: "/static/images/navdrawer/certificate.svg",
          href: querifiedSearchUrl({ certification: "true" }),
        },
      ],
    },
  ],
}

const Header: FunctionComponent = () => {
  const [drawerOpen, toggleDrawer] = useToggle(false)
  const [searchParams] = useSearchParams()
  const resourceDrawerOpen = searchParams.has(RESOURCE_DRAWER_QUERY_PARAM)

  const toggler = (event: React.MouseEvent) => {
    if (!resourceDrawerOpen) {
      // This is done to prevent ClickAwayHandler from closing the drawer upon open
      event.stopPropagation()
    }
    toggleDrawer(!drawerOpen)
  }
  const closeDrawer = (event: MouseEvent | TouchEvent) => {
    if (drawerOpen && !resourceDrawerOpen && event.type !== "touchstart") {
      event.preventDefault()
      toggleDrawer(false)
    }
  }

  return (
    <div>
      <Bar position="fixed">
        <StyledToolbar variant="dense">
          <DesktopOnly>
            <LogoLink />
            <LeftDivider orientation="vertical" flexItem />
            <MenuButton text="Explore MIT" onClick={toggler} />
          </DesktopOnly>
          <MobileOnly>
            <MenuButton onClick={toggler} />
            <LogoLink />
          </MobileOnly>
          <Spacer />
          <UserView />
        </StyledToolbar>
      </Bar>
      <ClickAwayListener
        onClickAway={closeDrawer}
        mouseEvent="onPointerDown"
        touchEvent="onTouchStart"
      >
        <div role="presentation">
          <NavDrawer navdata={navData} open={drawerOpen} />
        </div>
      </ClickAwayListener>
    </div>
  )
}

export default Header
